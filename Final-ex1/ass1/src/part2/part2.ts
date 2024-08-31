import * as R from "ramda";

const stringToArray = R.split("");

/* Question 1 */
export const countVowels = (str:string) => {
    return R.pipe(
        stringToArray, 
        R.filter(R.test(/[aeiou]/i)),
        R.length 
    )(str)
};


/* Question 2 */

const isOpeningParen = (char: string): boolean => '({['.includes(char);

const isClosingParen = (char: string): boolean => ')}]'.includes(char);

const isMatchingPair = (opening: string, closing: string): boolean => {
    switch (opening) {
        case '(': return closing === ')';
        case '{': return closing === '}';
        case '[': return closing === ']';
        default: return false;
    }
};

export const isPaired: (str: string) => boolean = R.pipe(
    stringToArray,
    R.reduce((stack: string[], char: string) => {
        if (isOpeningParen(char)) {
            return R.append(char, stack);
        } else if (isClosingParen(char)) {
            const lastOpening = R.last(stack);
            if (lastOpening && isMatchingPair(lastOpening, char)) {
                return R.dropLast(1, stack);
            } else {
                return R.append(char, stack);
            }
        }
        return stack;
    }, []),
    R.isEmpty
);


/* Question 3 */
export type WordTree = {
    root: string;
    children: WordTree[];
}
export const treeToSentence = (tree: WordTree): string => {
    const traverse = (node: WordTree): string[] => {
        const words = [node.root];
        const childWords = R.chain(traverse, node.children);
        return R.concat(words, childWords);
    };
    return R.join(" ", traverse(tree));
};


