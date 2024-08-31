/*
 * **********************************************
 * Printing result depth
 *
 * You can enlarge it, if needed.
 * **********************************************
 */
maximum_printing_depth(100).

:- current_prolog_flag(toplevel_print_options, A),
   (select(max_depth(_), A, B), ! ; A = B),
   maximum_printing_depth(MPD),
   set_prolog_flag(toplevel_print_options, [max_depth(MPD)|B]).


% Signature: path(Node1, Node2, Path)/3
% Purpose: Path is a path, denoted by a list of nodes, from Node1 to Node2.

path(Node1, Node2, Path):-
	edge(Node1, Node2), Path = [Node1, Node2];
    edge(Node1, Tmp), path(Tmp, Node2, SubPath), Path = [Node1|SubPath].







% Signature: cycle(Node, Cycle)/2
% Purpose: Cycle is a cyclic path, denoted a list of nodes, from Node1 to Node1.

cycle(Node, Cycle):-
    path(Node, Node, Cycle).







% Signature: reverse(Graph1,Graph2)/2
% Purpose: The edges in Graph1 are reversed in Graph2

reverse([],[]).

reverse(Graph1,Graph2):-
	reverse1(Graph1,Graph2).

reverse1([Head1|Tail1], [Head2|Tail2]) :-
	reverse2(Head1, Head2), reverse(Tail1, Tail2).
    
reverse2([Head1|Tail1], [Head2|Tail2]) :-
	[Head2] = Tail1, Tail2 = [Head1].
    






% Signature: degree(Node, Graph, Degree)/3
% Purpose: Degree is the degree of node Node, denoted by a Church number (as defined in class)

zero.
s(N):- N.
    
degree(Node, Graph, Degree):-
    helper(Node, Graph, zero, Degree).
 
helper(_, [], Degree, Degree).
helper(Node, [Head|Tail], Acc, Degree):-
    helper2(Node, Head), increment(Acc, NewAcc), helper(Node, Tail, NewAcc, Degree);
    helper(Node, Tail,Acc, Degree).
                                        
 helper2(Node, [Head|_]):-
    Head == Node.

increment(N, s(N)).










