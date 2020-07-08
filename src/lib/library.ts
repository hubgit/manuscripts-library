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

export const issuedYear = (item: Partial<BibliographyItem>): string | null => {
  if (
    !item.issued ||
    !item.issued['date-parts'] ||
    !item.issued['date-parts'][0] ||
    !item.issued['date-parts'][0][0]
  ) {
    return null
  }

  const [[year]] = item.issued['date-parts']

  return `${year}`
}

const firstAuthorName = (
  item: Partial<BibliographyItem>
): string | null | undefined => {
  if (!item) {
    return null
  }
  if (!item.author) {
    return null
  }
  if (!item.author.length) {
    return null
  }

  const author = item.author[0]

  return author.family || author.literal || author.given
}

const generateItemIdentifier = (item: Partial<BibliographyItem>): string =>
  JSON.stringify({
    title: item.title,
    author: firstAuthorName(item),
    year: issuedYear(item),
  })

export const estimateID = (item: Partial<BibliographyItem>): string => {
  if (item.DOI) {
    return item.DOI.toUpperCase()
  }

  if (item.PMID) {
    return item.PMID
  }

  return generateItemIdentifier(item)
}

export const shortAuthorsString = (item: Partial<BibliographyItem>): string => {
  const authors = (item.author || [])
    .map((author) => author.family || author.literal || author.given)
    .filter(Boolean) as string[]

  return authorsString(authors)
}

export const fullAuthorsString = (item: Partial<BibliographyItem>): string => {
  const authors = (item.author || [])
    .map((author) => [author.given, author.family].join(' ').trim())
    .filter(Boolean)

  return authorsString(authors)
}

export const authorsString = (authors: string[]): string => {
  if (authors.length > 1) {
    const lastAuthors = authors.splice(-2)
    authors.push(lastAuthors.join(' & '))
  }

  return authors.join(', ')
}

export const shortLibraryItemMetadata = (
  item: Partial<BibliographyItem>
): string => {
  return [shortAuthorsString(item), item['container-title'], issuedYear(item)]
    .filter(Boolean)
    .join(', ')
}

export const fullLibraryItemMetadata = (
  item: Partial<BibliographyItem>
): string => {
  return [fullAuthorsString(item), item['container-title'], issuedYear(item)]
    .filter(Boolean)
    .join(', ')
}
