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
  buildBibliographicDate,
  buildBibliographicName,
} from '@manuscripts/manuscript-transform'
import {
  BibliographicDate,
  BibliographicName,
  BibliographyItem,
} from '@manuscripts/manuscripts-json-schema'

const personFields: Array<CSL.PersonFieldKey> = [
  'author',
  'collection-editor',
  'composer',
  'container-author',
  'director',
  'editor',
  'editorial-director',
  'illustrator',
  'interviewer',
  'original-author',
  'recipient',
  'reviewed-author',
  'translator',
]

const dateFields: Array<CSL.DateFieldKey> = [
  'accessed',
  'container',
  'event-date',
  'issued',
  'original-date',
  'submitted',
]

const stringFields: Array<CSL.StringFieldKey> = [
  'abstract',
  'annote',
  'archive',
  'archive-place',
  'archive_location',
  'authority',
  'call-number',
  // 'categories',
  // 'chapter-number',
  'citation-label',
  'citation-number',
  // 'collection-number',
  'collection-title',
  'container-title',
  'container-title-short',
  'dimensions',
  'DOI',
  // 'edition',
  'event',
  'event-place',
  'first-reference-note-number',
  'genre',
  'ISBN',
  'ISSN',
  // 'issue',
  'journalAbbreviation',
  'jurisdiction',
  'keyword',
  'language',
  'locator',
  'medium',
  'note',
  'number',
  // 'number-of-pages',
  // 'number-of-volumes',
  'original-publisher',
  'original-publisher-place',
  'original-title',
  'page',
  'page-first',
  'PMCID',
  'PMID',
  'publisher',
  'publisher-place',
  'references',
  'reviewed-title',
  'scale',
  'section',
  'shortTitle',
  'source',
  'status',
  'title',
  'title-short',
  // 'type',
  'URL',
  'version',
  // 'volume',
  'year-suffix',
]

const numberFields: Array<CSL.NumberFieldKey> = [
  'chapter-number',
  // 'citation-number',
  'collection-number',
  'edition',
  'issue',
  // 'number',
  'number-of-pages',
  'number-of-volumes',
  'volume',
]

const isNumberFieldKey = (key: string): key is CSL.NumberFieldKey =>
  numberFields.includes(key as CSL.NumberFieldKey)

const isStringFieldKey = (key: string): key is CSL.StringFieldKey =>
  stringFields.includes(key as CSL.StringFieldKey)

const isPersonFieldKey = (key: string): key is CSL.PersonFieldKey =>
  personFields.includes(key as CSL.PersonFieldKey)

const isDateFieldKey = (key: string): key is CSL.DateFieldKey =>
  dateFields.includes(key as CSL.DateFieldKey)

export const convertDataToBibliographyItem = (
  data: CSL.Data
): Partial<BibliographyItem> => {
  // const output: { [key in keyof BibliographyItem]: BibliographyItem[key] } = {}

  const output: Partial<BibliographyItem> = {
    // id: data.id,
    type: data.type,
  }

  for (const [key, item] of Object.entries(data)) {
    if (isNumberFieldKey(key)) {
      // @ts-ignore TODO
      output[key] = Number.isInteger(item) ? item : String(item)
    } else if (isStringFieldKey(key)) {
      // @ts-ignore TODO
      output[key] = String(item)
    } else if (isPersonFieldKey(key)) {
      output[key] = (item as CSL.Person[]).map(buildBibliographicName)
    } else if (isDateFieldKey(key)) {
      output[key] = buildBibliographicDate(item as Partial<BibliographicDate>)
    }
  }

  return output
}

export const convertBibliographyItemToData = (
  bibliographyItem: BibliographyItem
): CSL.Data =>
  Object.entries(bibliographyItem).reduce(
    (output, [key, item]) => {
      if (isNumberFieldKey(key)) {
        output[key] = Number.isInteger(item) ? item : String(item)
      } else if (isStringFieldKey(key)) {
        output[key] = String(item)
      } else if (isPersonFieldKey(key)) {
        output[key] = (item as BibliographicName[]).map((name) => {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { _id, objectType, ...rest } = name
          return rest
        }) as CSL.Person[]
      } else if (isDateFieldKey(key)) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { _id, objectType, ...rest } = item as BibliographicDate
        output[key] = rest as CSL.Date
      }

      return output
    },
    {
      id: bibliographyItem._id,
      type: bibliographyItem.type || 'article-journal',
    } as CSL.Data
  )

export const fixCSLData = (item: CSL.Data): CSL.Data => {
  // ensure that string fields don't contain arrays
  stringFields.forEach((key) => {
    if (key in item) {
      if (Array.isArray(item[key])) {
        const [data] = (item[key] as unknown) as string[]
        item[key] = data || undefined
      }
    }
  })

  return item
}
