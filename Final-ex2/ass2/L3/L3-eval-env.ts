// L3-eval.ts
// Evaluator with Environments model

import { map } from "ramda";
import { isBoolExp, isCExp, isLitExp, isNumExp, isPrimOp, isStrExp, isVarRef,
         isAppExp, isDefineExp, isIfExp, isLetExp, isProcExp,
         Binding, VarDecl, CExp, Exp, IfExp, LetExp, ProcExp, Program,
         parseL3Exp,  DefineExp, ClassExp, isClassExp} from "./L3-ast";
import { applyEnv, makeEmptyEnv, makeExtEnv, Env } from "./L3-env-env";
import { isClosure, makeClosureEnv, Closure, Value, Class, Object, makeClassEnv, makeObjectEnv, isClass, isObject,isSymbolSExp} from "./L3-value";
import { applyPrimitive } from "./evalPrimitive";
import { allT, first, rest, isEmpty, isNonEmptyList } from "../shared/list";
import { Result, makeOk, makeFailure, bind, mapResult } from "../shared/result";
import { parse as p } from "../shared/parser";
import { format } from "../shared/format";

// ========================================================
// Eval functions

const applicativeEval = (exp: CExp, env: Env): Result<Value> =>
    isNumExp(exp) ? makeOk(exp.val) :
    isBoolExp(exp) ? makeOk(exp.val) :
    isStrExp(exp) ? makeOk(exp.val) :
    isPrimOp(exp) ? makeOk(exp) :
    isVarRef(exp) ? applyEnv(env, exp.var) :
    isLitExp(exp) ? makeOk(exp.val) :
    isIfExp(exp) ? evalIf(exp, env) :
    isProcExp(exp) ? evalProc(exp, env) :
    isLetExp(exp) ? evalLet(exp, env) :
    isAppExp(exp) ? bind(applicativeEval(exp.rator, env),
                      (proc: Value) =>
                        bind(mapResult((rand: CExp) => 
                           applicativeEval(rand, env), exp.rands),
                              (args: Value[]) => (!isClass(proc))?
                                 applyProcedure(proc, args) : applyClass(proc, args,env))) :
    isClassExp(exp)? evalClass(exp, env):
    makeFailure('"let" not supported (yet)');

const evalClass = (exp:ClassExp , env:Env): Result<Class> =>{
    return makeOk(makeClassEnv(exp.fields, exp.methods, env));
}

export const isTrueValue = (x: Value): boolean =>
    ! (x === false);

const evalIf = (exp: IfExp, env: Env): Result<Value> =>
    bind(applicativeEval(exp.test, env), (test: Value) => 
            isTrueValue(test) ? applicativeEval(exp.then, env) : 
            applicativeEval(exp.alt, env));

const evalProc = (exp: ProcExp, env: Env): Result<Closure> =>
    makeOk(makeClosureEnv(exp.args, exp.body, env));

// KEY: This procedure does NOT have an env parameter.
//      Instead we use the env of the closure.
const applyProcedure = (proc: Value, args: Value[]): Result<Value> =>
    isPrimOp(proc) ? applyPrimitive(proc, args) :
    isClosure(proc) ? applyClosure(proc, args) :
    isObject(proc) ? applyObject(proc, args):
    makeFailure(`Bad procedure ${format(proc)}`);


    ////////////////////////////////////////////////////////////////////////////added by me
const applyObject = (obj: Value, args: Value[]): Result<Value> => {
    if (isSymbolSExp(args[0]) && isObject(obj)) {
        const meth_name = args[0].val;   // the name of the method is the first element of the args[]
        const meth_args_vals = args.slice(1);  // The method arguments are the remaining elements in the args array
        const found_method: Binding | undefined = obj.class.methods.find(binding => binding.var.var === meth_name); //find and extract the corresponding method, if exist
        if (found_method === undefined)
            return makeFailure(`Unrecognized method: ${meth_name}`);
        const my_method = found_method?.val;
        if (my_method !== undefined && isProcExp(my_method)) {
            const my_method_var_decls = my_method.args; // The VarDecl of the method
            const my_method_args_str = map((arg: VarDecl) => arg.var, my_method_var_decls); // The argument names as strings
            const ext_fields_env = makeExtEnv(map(v => v.var, obj.class.fields),obj.fieldsVal, obj.env); // Extend the environment with the object's fields
            const completed_env = makeExtEnv(my_method_args_str,meth_args_vals , ext_fields_env);   // Extend the environment with the method's arguments
            return evalSequence(my_method.body, completed_env); // Evaluate the method body in the extended environment
        }
        return makeFailure(`Unrecognized method: ${meth_name}`);
    }
    return makeFailure("syntax error :(");
}

///////////////////////////////////////////////////////////////////////////////added by me

const applyClass = (my_class: Value, args: Value[], env:Env): Result<Value> =>
    isClass(my_class) ? makeOk(makeObjectEnv(my_class, args, env)):
    makeFailure(`Bad Class ${format(my_class)}`);



const applyClosure = (proc: Closure, args: Value[]): Result<Value> => {
    const vars = map((v: VarDecl) => v.var, proc.params);
    return evalSequence(proc.body, makeExtEnv(vars, args, proc.env));
}

// Evaluate a sequence of expressions (in a program)
export const evalSequence = (seq: Exp[], env: Env): Result<Value> =>
    {
    return isNonEmptyList<Exp>(seq) ? evalCExps(first(seq), rest(seq), env) : 
    makeFailure("Empty sequence");}
    
const evalCExps = (first: Exp, rest: Exp[], env: Env): Result<Value> =>
    isDefineExp(first) ? evalDefineExps(first, rest, env) :
    isCExp(first) && isEmpty(rest) ? applicativeEval(first, env) :
    isCExp(first) ? bind(applicativeEval(first, env), _ => evalSequence(rest, env)) :
    first;
    
// Eval a sequence of expressions when the first exp is a Define.
// Compute the rhs of the define, extend the env with the new binding
// then compute the rest of the exps in the new env.
const evalDefineExps = (def: DefineExp, exps: Exp[], env: Env): Result<Value> =>
    {
    return bind(applicativeEval(def.val, env), (rhs: Value) => 
            evalSequence(exps, makeExtEnv([def.var.var], [rhs], env)));}


// Main program
export const evalL3program = (program: Program): Result<Value> =>
    evalSequence(program.exps, makeEmptyEnv());

export const evalParse = (s: string): Result<Value> =>
    bind(p(s), (x) => 
        bind(parseL3Exp(x), (exp: Exp) =>
            evalSequence([exp], makeEmptyEnv())));

// LET: Direct evaluation rule without syntax expansion
// compute the values, extend the env, eval the body.
const evalLet = (exp: LetExp, env: Env): Result<Value> => {
    const vals  = mapResult((v: CExp) => 
        applicativeEval(v, env), map((b: Binding) => b.val, exp.bindings));
    const vars = map((b: Binding) => b.var.var, exp.bindings);
    return bind(vals, (vals: Value[]) => 
        evalSequence(exp.body, makeExtEnv(vars, vals, env)));
}