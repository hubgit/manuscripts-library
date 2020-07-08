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

import {
  authorsString,
  estimateID,
  fullLibraryItemMetadata,
  issuedYear,
  shortAuthorsString,
  shortLibraryItemMetadata,
} from '../library'

describe('issued year', () => {
  it('issuedYear', () => {
    const item = {
      issued: {
        ['date-parts']: [['2019']],
      },
    } as BibliographyItem

    expect(issuedYear(item)).toBe('2019')

    expect(issuedYear({} as BibliographyItem)).toBeNull()
  })
})

describe('estimate ID', () => {
  it('estimateID - DOI exists', () => {
    const item = {
      DOI: 'valid-doi',
    }
    expect(estimateID(item)).toBe('VALID-DOI')
  })

  it('estimateID - DOI does not exist', () => {
    const item = {
      title: 'title',
      issued: {
        ['date-parts']: [['2019']],
      },
    }

    expect(estimateID(item as BibliographyItem)).toBe(
      JSON.stringify({
        title: 'title',
        author: null,
        year: '2019',
      })
    )

    expect(
      estimateID(({ author: [], ...item } as unknown) as BibliographyItem)
    ).toBe(
      JSON.stringify({
        title: 'title',
        author: null,
        year: '2019',
      })
    )

    const author = [
      {
        family: 'family',
        literal: 'L',
        given: 'given',
      },
    ] as unknown

    expect(estimateID({ ...item, author } as BibliographyItem)).toBe(
      JSON.stringify({
        title: 'title',
        author: 'family',
        year: '2019',
      })
    )

    expect(
      estimateID(({
        ...item,
        DOI: undefined,
        PMID: '1234567',
      } as unknown) as BibliographyItem)
    ).toBe('1234567')
  })
})

describe('short authors string', () => {
  it('shortAuthorsString - 1 author', () => {
    const item = {
      author: [
        {
          family: 'family',
          literal: 'L',
          given: 'given',
        },
      ],
    } as BibliographyItem

    expect(shortAuthorsString(item)).toBe('family')
  })

  it('shortAuthorsString - 2 author', () => {
    const item = {
      author: [{ family: 'family' }, { literal: 'L' }],
    } as BibliographyItem

    expect(shortAuthorsString(item)).toBe('family & L')
  })

  it('shortAuthorsString - 4 author', () => {
    const item = {
      author: [
        { family: 'family' },
        { literal: 'L' },
        { given: 'given' },
        { family: 'family2' },
      ],
    } as BibliographyItem

    expect(shortAuthorsString(item)).toBe('family, L, given & family2')
  })
})

describe('authorsString', () => {
  it('handles a single author', () => {
    const authors = ['given-1']
    expect(authorsString(authors)).toBe('given-1')
  })

  it('joins two authors with an ampersand', () => {
    const authors = ['given-1', 'given-2']
    expect(authorsString(authors)).toBe('given-1 & given-2')
  })

  it('joins 3 authors with comma and use ampersand to join the last 2 authors', () => {
    const authors = ['given-1', 'given-2', 'given-3']
    expect(authorsString(authors)).toBe('given-1, given-2 & given-3')
  })

  it('joins 4 authors with comma and use ampersand to join the last 2 authors', () => {
    const authors = ['given-1', 'given-2', 'given-3', 'given-4']
    expect(authorsString(authors)).toBe('given-1, given-2, given-3 & given-4')
  })
})

describe('libraryItemMetadata', () => {
  it('handles library item with missing authors', () => {
    const item = {
      issued: {
        ['date-parts']: [['2019']],
      },
      ['container-title']: 'journal name',
    } as BibliographyItem

    expect(fullLibraryItemMetadata(item)).toBe('journal name, 2019')
    expect(shortLibraryItemMetadata(item)).toBe('journal name, 2019')
  })

  it('handles library item with missing date and journal name', () => {
    const item = {
      author: [{ given: 'given-1' }, { given: 'given-2' }],
    } as BibliographyItem

    expect(fullLibraryItemMetadata(item)).toBe('given-1 & given-2')
    expect(shortLibraryItemMetadata(item)).toBe('given-1 & given-2')
  })

  it('handles library item with defined date', () => {
    const item = {
      author: [{ given: 'given-1' }, { given: 'given-2' }],
      issued: {
        ['date-parts']: [['2019']],
      },
    } as BibliographyItem

    expect(fullLibraryItemMetadata(item)).toBe('given-1 & given-2, 2019')
    expect(shortLibraryItemMetadata(item)).toBe('given-1 & given-2, 2019')
  })

  it('handles library item with defined date and journal', () => {
    const item = {
      author: [{ given: 'given-1' }, { given: 'given-2' }],
      issued: {
        ['date-parts']: [['2019']],
      },
      ['container-title']: 'journal name',
    } as BibliographyItem

    expect(fullLibraryItemMetadata(item)).toBe(
      'given-1 & given-2, journal name, 2019'
    )
    expect(shortLibraryItemMetadata(item)).toBe(
      'given-1 & given-2, journal name, 2019'
    )
  })

  it('handles author with no name', () => {
    const item = {
      author: [{ given: 'given-1' }, {}],
      issued: {
        ['date-parts']: [['2019']],
      },
    } as BibliographyItem

    expect(fullLibraryItemMetadata(item)).toBe('given-1, 2019')
    expect(shortLibraryItemMetadata(item)).toBe('given-1, 2019')
  })
})
