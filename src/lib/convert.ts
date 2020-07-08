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
  CSL,
} from '@manuscripts/manuscript-transform'
import {
  BibliographicDate,
  BibliographicName,
  BibliographyItem,
} from '@manuscripts/manuscripts-json-schema'

const roleFields: Array<keyof CSL.RoleFields> = [
  'author',
  'collection-editor',
  'composer',
  'container-author',
  'director',
  'editor',
  'editorial-director',
  'interviewer',
  'illustrator',
  'original-author',
  'recipient',
  'reviewed-author',
  'translator',
]

const dateFields: Array<keyof CSL.DateFields> = [
  'accessed',
  'container',
  'event-date',
  'issued',
  'original-date',
  'submitted',
]

const standardFields: Array<keyof CSL.StandardFields> = [
  'abstract',
  'annote',
  'archive',
  'archive-place',
  'archive_location',
  'authority',
  'call-number',
  'categories',
  'chapter-number',
  'citation-label',
  'citation-number',
  'collection-number',
  'collection-title',
  'container-title',
  'container-title-short',
  'dimensions',
  'DOI',
  'edition',
  'event',
  'event-place',
  'first-reference-note-number',
  'genre',
  'ISBN',
  'ISSN',
  'issue',
  'journalAbbreviation',
  'jurisdiction',
  'keyword',
  'language',
  'locator',
  'medium',
  'note',
  'number',
  'number-of-pages',
  'number-of-volumes',
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
  'type',
  'URL',
  'version',
  'volume',
  'year-suffix',
]

const numberFields = [
  'chapter-number',
  'citation-number',
  'collection-number',
  'number',
  'number-of-pages',
  'number-of-volumes',
]

export const convertDataToBibliographyItem = (
  data: CSL.Item
): Partial<BibliographyItem> => {
  // const output: { [key in keyof BibliographyItem]: BibliographyItem[key] } = {}

  const output: { [key: string]: unknown } = {}

  for (const [key, item] of Object.entries(data)) {
    if (key === 'circa') {
      output[key] = Boolean(item)
    } else if (standardFields.includes(key as keyof CSL.StandardFields)) {
      output[key] = numberFields.includes(key) ? Number(item) : item
    } else if (roleFields.includes(key as keyof CSL.RoleFields)) {
      output[key] = (item as CSL.Name[]).map((value) =>
        buildBibliographicName(value)
      )
    } else if (dateFields.includes(key as keyof CSL.DateFields)) {
      output[key] = buildBibliographicDate(item as CSL.Date)
    }
  }

  return output
}

export const convertBibliographyItemToData = (
  bibliographyItem: BibliographyItem
): CSL.Item =>
  Object.entries(bibliographyItem).reduce(
    (output, [key, item]) => {
      if (standardFields.includes(key as keyof CSL.StandardFields)) {
        output[key] = item as string
      } else if (roleFields.includes(key as keyof CSL.RoleFields)) {
        output[key] = (item as BibliographicName[]).map((name) => {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { _id, objectType, ...rest } = name
          return rest
        }) as CSL.Name[]
      } else if (dateFields.includes(key as keyof CSL.DateFields)) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { _id, objectType, ...rest } = item as BibliographicDate
        output[key] = rest as CSL.Date
      }

      return output
    },
    {
      id: bibliographyItem._id,
      type: bibliographyItem.type || 'article-journal',
    } as CSL.Item & { [key: string]: unknown }
  )
