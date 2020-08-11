/*!
 * © 2020 Atypon Systems LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { evaluateXPathToString } from 'fontoxpath'

const FIELD_MAPS: Map<string, keyof CSL.Data> = new Map([
  ['title', 'title'],
  ['publisher', 'publisher'],
  ['url', 'URL'],
  ['volume', 'volume'],
  ['number', 'issue'],
  ['doi', 'DOI'],
  ['bundle/publication/title', 'container-title'],
])

const TYPE_MAP: Map<number, CSL.ItemType> = new Map([
  [0, 'book'],
  [400, 'article-journal'],
])

export const parse = (xml: string): CSL.Data[] => {
  const doc = new DOMParser().parseFromString(xml, 'application/xml')

  // @ts-ignore
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const FIELD_TRANSFORMS: Map<keyof CSL.Data, (node: Node) => any> = new Map([
    [
      'type',
      (node) => {
        const type = evaluateXPathToString('type', node)

        if (type === '') {
          return
        }

        return TYPE_MAP.get(Number(type))
      },
    ],
    [
      'author',
      (node) => {
        const authorNodes = evaluateXPathToNodes('authors/author', node)

        if (!authorNodes.length) {
          return
        }

        const items: CSL.Person[] = []

        for (const authorNode of authorNodes) {
          items.push({
            given: [
              evaluateXPathToString('firstName', authorNode),
              evaluateXPathToString('middleNames', authorNode),
            ]
              .filter(Boolean)
              .join(' '),
            family: evaluateXPathToString('lastName', authorNode),
          })
        }

        return items
      },
    ],
    [
      'page',
      (node) => {
        const startPage = evaluateXPathToString('startpage', node)

        if (startPage === '') {
          return
        }

        const parts = [startPage]

        const endPage = evaluateXPathToString('endpage', node)

        if (endPage !== '') {
          parts.push(endPage)
        }

        return parts.join('-')
      },
    ],
    [
      'issued',
      (node) => {
        const publicationDate = evaluateXPathToString('publication_date', node)

        const matches = publicationDate.match(/^99(\d{4})(\d{2})(\d{2})/)

        if (!matches) {
          return
        }

        const [year, month, day] = matches.slice(1).map(Number)

        const parts: number[] = []

        if (year) {
          parts.push(year)
        }

        if (month >= 1 && month <= 12) {
          parts.push(month)
        }

        if (day >= 1 && day <= 31) {
          parts.push(day)
        }

        return {
          'date-parts': [parts],
        }
      },
    ],
  ])

  const evaluateXPathToNodes = (xpath: string, contextNode: Node): Node[] => {
    const result = doc.evaluate(
      xpath,
      contextNode,
      null,
      XPathResult.ORDERED_NODE_SNAPSHOT_TYPE,
      null
    )

    const nodes: Node[] = []

    for (let i = 0; i < result.snapshotLength; i++) {
      nodes.push(result.snapshotItem(i) as Node)
    }

    return nodes
  }

  const parseItem = (node: Node): CSL.Data => {
    const output: Partial<CSL.Data> = {}

    for (const [key, transform] of FIELD_TRANSFORMS.entries()) {
      const result = transform(node)

      if (result !== undefined) {
        output[key] = result
      }
    }

    for (const [xpath, key] of FIELD_MAPS.entries()) {
      const result = evaluateXPathToString(xpath, node)

      if (result !== '') {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        output[key] = result as any
      }
    }

    return output as CSL.Data
  }

  const publicationNodes = evaluateXPathToNodes(
    '/citation/publications/publication',
    doc
  )

  return publicationNodes.map(parseItem)
}
