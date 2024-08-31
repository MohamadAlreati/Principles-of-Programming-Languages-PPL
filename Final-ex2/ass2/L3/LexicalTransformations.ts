import { ClassExp, ProcExp, Exp, Program, Binding, VarDecl, CExp, isClassExp, makeBoolExp,isExp,isDefineExp, isProgram, makeLitExp,makeAppExp, makeIfExp, makeProcExp, makeVarDecl, makeVarRef, makePrimOp, makeStrExp, makeDefineExp, makeProgram } from "./L3-ast";
import { Result, makeFailure, makeOk, mapResult, bind, isOk } from "../shared/result";
import { makeSymbolSExp } from "./L3-value";


export const class2proc = (exp: ClassExp): ProcExp => {
    const fields: VarDecl[] = exp.fields;
    const methods: Binding[] = exp.methods;

    const genrateMethodBody = (methods: Binding[], currentIndex: number): CExp => {
        if (currentIndex >= methods.length) {
            return makeBoolExp(false); 
        } else {
            const methodName: string = methods[currentIndex].var.var;
            const methodBody: CExp = methods[currentIndex].val;
            return makeIfExp(
                makeAppExp(makePrimOp("eq?"), [makeVarRef("msg"), makeLitExp(makeSymbolSExp(methodName))]),
                makeAppExp(methodBody, []),
                genrateMethodBody(methods, currentIndex + 1)
            );
        }
    };
    const methodsBody: CExp = genrateMethodBody(methods, 0);
    const dispatcher: ProcExp = makeProcExp([makeVarDecl("msg")], [methodsBody]);
    return makeProcExp(fields, [dispatcher]);
};


export const lexTransform = (exp: Exp | Program): Result<Exp | Program> =>
    isProgram(exp)
        ? bind(mapResult(transformExp, exp.exps), (exps: Exp[]) => makeOk(makeProgram(exps)))
        : transformExp(exp);

const transformExp = (exp: Exp): Result<Exp> => {
    if (isClassExp(exp)) {
        return makeOk(class2proc(exp));
    } else if (isDefineExp(exp) && isClassExp(exp.val)) {
        const transformedValResult: Result<Exp> = transformExp(exp.val);
        return bind(transformedValResult, (transformedVal: Exp) =>
    makeOk(makeDefineExp(exp.var, transformedVal as CExp)) 
);
    } else {
        return makeOk(exp);
    }
};




