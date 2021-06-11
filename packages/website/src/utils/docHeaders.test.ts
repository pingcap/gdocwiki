import { MakeTree, MakeTree2, DocHeader, treeHeading } from "./docHeaders"

let counter = 0;
function h(level: number): DocHeader {
    counter += 1;
    return {
        level,
        text: counter.toString(),
        id: "id",
    }
}

const h1: DocHeader = h(1);
const h2: DocHeader = h(2);
const h3: DocHeader = h(3);
const h4: DocHeader = h(4);

describe('MakeTree', () => {
    it('empty headers', () => {
        expect(MakeTree([])).toEqual([])
    })

    it('one level of headers', () => {
        expect(MakeTree([h1])).toEqual([h1])
        expect(MakeTree([h1, h1])).toEqual([h1, h1])
        expect(MakeTree([h2, h2])).toEqual([h2, h2])
    })

    it('multiple levels of headers', () => {
        expect(MakeTree([h1, h2])).toEqual([
          treeHeading(h1, [h2])
        ])

        expect(MakeTree([h1, h2, h1])).toEqual([
          treeHeading(h1, [h2]),
          h1,
        ])

        expect(MakeTree([h1, h2, h1, h2])).toEqual([
          treeHeading(h1, [h2]),
          treeHeading(h1, [h2]),
        ])
    })

    it('regession test', () => {
        let result = MakeTree([h1, h2, h3, h3, h2, h3, h4])
        expect(result).toEqual([
          treeHeading(h1, [
            treeHeading(h2, [h3, h3]),
            treeHeading(h2, [
                treeHeading(h3, [h4])
            ]),
          ]),
        ])
    })
})

export {}