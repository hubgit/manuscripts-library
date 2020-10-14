/*!
 * © 2019 Atypon Systems LLC
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

import {
  CitationNode,
  isCitationNode,
  ManuscriptNode,
} from '@manuscripts/manuscript-transform'
import {
  BibliographyItem,
  Citation,
  CitationItem,
  Manuscript,
  Model,
} from '@manuscripts/manuscripts-json-schema'
import CiteProc from 'citeproc'

export const buildCitationNodes = (
  doc: ManuscriptNode,
  getModel: GetModel
): CitationNodes => {
  const citationNodes: CitationNodes = []

  doc.descendants((node, pos) => {
    if (isCitationNode(node)) {
      const citation = getModel<Citation>(node.attrs.rid)

      if (citation) {
        citationNodes.push([node, pos, citation])
      }
    }
  })

  return citationNodes
}

export type CitationNodes = Array<[CitationNode, number, Citation]>
export type GetLibraryItem = (id: string) => BibliographyItem | undefined
export type GetModel = <T extends Model>(id: string) => T | undefined
export type GetManuscript = () => Manuscript

type DisplayScheme =
  | 'show-all'
  | 'author-only'
  | 'suppress-author'
  | 'composite'

const chooseMode = (displayScheme?: DisplayScheme) => {
  if (displayScheme === 'show-all') {
    return undefined
  }

  return displayScheme
}

export const buildCitations = (
  citationNodes: CitationNodes,
  getLibraryItem: GetLibraryItem,
  getManuscript: GetManuscript
): CiteProc.Citation[] =>
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  citationNodes.map(([node, pos, citation]) => ({
    citationID: citation._id,
    citationItems: citation.embeddedCitationItems.map(
      (citationItem: CitationItem) => ({
        id: citationItem.bibliographyItem,
        data: getLibraryItem(citationItem.bibliographyItem), // for comparison
      })
    ),
    properties: {
      noteIndex: 0,
      mode: chooseMode(citation.displayScheme),
      prefix: citation.prefix,
      suffix: citation.suffix,
      infix:
        citation.displayScheme === 'composite' ? citation.infix : undefined,
    },
    manuscript: getManuscript(), // for comparison
  }))

export const bibliographyElementContents = (
  node: ManuscriptNode,
  id: string,
  items: string[]
): string => {
  const contents = document.createElement('div')
  contents.classList.add('csl-bib-body')
  contents.setAttribute('id', id)

  if (items.length) {
    contents.innerHTML = items.join('\n')
  } else {
    contents.classList.add('empty-node')
    contents.setAttribute('data-placeholder', node.attrs.placeholder)
  }

  return contents.outerHTML
}
