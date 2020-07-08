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
import { BibliographyItem, Bundle } from '@manuscripts/manuscripts-json-schema'
import CiteProc from 'citeproc'

import { convertBibliographyItemToData } from './convert'
import { variableWrapper } from './variable-wrapper'

interface Options {
  bundleID?: string
  bundle?: Bundle
  citationStyleData?: string
}

export type GetCitationProcessor = () => CiteProc.Engine | undefined

export const createProcessor = async (
  primaryLanguageCode: string,
  getLibraryItem: (id: string) => BibliographyItem | undefined,
  options: Options = {}
): Promise<CiteProc.Engine> => {
  const citationStyleData: string | CiteProc.Style | undefined =
    options.citationStyleData ||
    (await loadCitationStyleFromBundle(options.bundle)) ||
    (await loadCitationStyleFromBundleID(options.bundleID))

  if (!citationStyleData) {
    throw new Error('Missing citation style data')
  }

  const parentStyleData = await findParentStyle(citationStyleData)

  // TODO: merge metadata (locales) into parent from child?

  const locales = (await import(
    // @ts-ignore
    '@manuscripts/csl-locales/dist/locales.json'
  )) as Record<string, CiteProc.Locale>

  return new CiteProc.Engine(
    {
      retrieveItem: (id: string): CSL.Data => {
        const item = getLibraryItem(id)

        if (!item) {
          throw new Error(`Library item ${id} is missing`)
        }

        return convertBibliographyItemToData(item)
      },
      retrieveLocale: (id: string): CiteProc.Locale => locales[id],
      variableWrapper,
    },
    parentStyleData || citationStyleData,
    primaryLanguageCode,
    false
  )
}

const loadCitationStyleFromBundle = async (
  bundle?: Bundle
): Promise<CiteProc.Style | undefined> => {
  if (bundle && bundle.csl && bundle.csl.cslIdentifier) {
    return loadStyle(bundle.csl.cslIdentifier)
  }

  return undefined
}

const loadCitationStyleFromBundleID = async (
  bundleID?: string
): Promise<CiteProc.Style | undefined> => {
  const bundles: Bundle[] = await import(
    // @ts-ignore
    '@manuscripts/data/dist/shared/bundles.json'
  )

  const bundle = bundles.find((item) => item._id === bundleID)

  return loadCitationStyleFromBundle(bundle)
}

const findParentStyle = async (
  citationStyleData: string | CiteProc.Style
): Promise<CiteProc.Style | undefined> => {
  const parser = CiteProc.setupXml(citationStyleData)

  const links = parser.getNodesByName(parser.dataObj, 'link') as CiteProc.Node[]

  const parentLink = links.find(
    (link) => link.attrs.rel === 'independent-parent'
  )

  if (parentLink) {
    const href = parentLink.attrs.href as string | undefined

    if (href && href.startsWith('http://www.zotero.org/styles/')) {
      return loadStyle(href)
    }
  }
}

export const loadStyle = async (id: string): Promise<CiteProc.Style> => {
  const basename = id.split('/').pop()

  if (!basename) {
    throw new Error('No style name')
  }

  const styles = await import(
    `@manuscripts/csl-styles/dist/${basename[0]}.json`
  )

  return styles[id] as CiteProc.Style
}
