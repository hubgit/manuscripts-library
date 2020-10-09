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

import { BibliographyItem } from '@manuscripts/manuscripts-json-schema'

import { convertDataToBibliographyItem } from './convert'

export const chooseParser = (format: string) => {
  format = format.replace(/^application\/(x-)?/, '').replace(/^\./, '')

  switch (format) {
    case 'bib':
    case 'bibtex':
      return import('astrocite-bibtex')

    case 'ris':
    case 'research-info-systems':
      return import('astrocite-ris')

    case 'papers-citations-xml':
      return import('./papers-citations')

    case 'citeproc+json':
      return Promise.resolve({
        parse: JSON.parse,
      })

    default:
      throw new Error(`Unknown citation format ${format}`)
  }
}

const validRISLine = /^(\w{2}\s{2}-\s.+|ER\s{2}-\s*)$/

export const transformBibliography = async (
  data: string,
  extension: string
): Promise<Array<Partial<BibliographyItem>>> => {
  const { parse } = await chooseParser(extension)

  if (extension === '.ris') {
    // remove invalid lines
    data = data
      .split(/[\n\r]+/)
      .filter((line) => validRISLine.test(line))
      .join('\n')
  }

  const items = parse(data) as CSL.Data[]

  return items.map(convertDataToBibliographyItem)
}

export const matchLibraryItemByIdentifier = (
  item: BibliographyItem,
  library: Map<string, BibliographyItem>
): BibliographyItem | undefined => {
  if (library.has(item._id)) {
    return library.get(item._id)
  }

  if (item.DOI) {
    const doi = item.DOI.toLowerCase()

    for (const model of library.values()) {
      if (model.DOI && model.DOI.toLowerCase() === doi) {
        return model
      }
    }
  }

  if (item.PMID) {
    for (const model of library.values()) {
      if (model.PMID && model.PMID === item.PMID) {
        return model
      }
    }
  }

  if (item.URL) {
    const url = item.URL.toLowerCase()

    for (const model of library.values()) {
      if (model.URL && model.URL.toLowerCase() === url) {
        return model
      }
    }
  }
}

export const bibliographyItemTypes = new Map<CSL.ItemType, string>([
  ['article', 'Article'],
  ['article-journal', 'Journal Article'],
  ['article-magazine', 'Magazine Article'],
  ['article-newspaper', 'Newspaper Article'],
  ['bill', 'Bill'],
  ['book', 'Book'],
  ['broadcast', 'Broadcast'],
  ['chapter', 'Chapter'],
  ['dataset', 'Dataset'],
  ['entry', 'Entry'],
  ['entry-dictionary', 'Dictionary Entry'],
  ['entry-encyclopedia', 'Encyclopedia Entry'],
  ['figure', 'Figure'],
  ['graphic', 'Graphic'],
  ['interview', 'Interview'],
  ['legal_case', 'Legal Case'],
  ['legislation', 'Legislation'],
  ['manuscript', 'Manuscript'],
  ['map', 'Map'],
  ['motion_picture', 'Motion Picture'],
  ['musical_score', 'Musical Score'],
  ['pamphlet', 'Pamphlet'],
  ['paper-conference', 'Conference Paper'],
  ['patent', 'Patent'],
  ['personal_communication', 'Personal Communication'],
  ['post', 'Post'],
  ['post-weblog', 'Blog Post'],
  ['report', 'Report'],
  ['review', 'Review'],
  ['review-book', 'Book Review'],
  ['song', 'Song'],
  ['speech', 'Speech'],
  ['thesis', 'Thesis'],
  ['treaty', 'Treaty'],
  ['webpage', 'Web Page'],
])
