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
import { evaluateXPath, evaluateXPathToString } from 'fontoxpath'

import { convertBibliographyItemToData } from './convert'
import { variableWrapper } from './variable-wrapper'

interface Options {
  bundleID?: string
  bundle?: Bundle
  citationStyleData?: string
}

const namespaceMap = new Map<string | null, string>([
  ['csl', 'http://purl.org/net/xbiblio/csl'],
])

const namespaceResolver = (prefix: string | null): string | null =>
  namespaceMap.has(prefix) ? (namespaceMap.get(prefix) as string) : null

export type GetCitationProcessor = () => CiteProc.Engine | undefined

export const createProcessor = async (
  primaryLanguageCode: string,
  getLibraryItem: (id: string) => BibliographyItem | undefined,
  options: Options = {}
): Promise<CiteProc.Engine> => {
  const citationStyleData: string | undefined =
    options.citationStyleData ||
    (await loadCitationStyleFromBundle(options.bundle)) ||
    (await loadCitationStyleFromBundleID(options.bundleID))

  if (!citationStyleData) {
    throw new Error('Missing citation style data')
  }

  const styleData = await buildDependendentStyle(citationStyleData)

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
    styleData,
    primaryLanguageCode,
    false
  )
}

const loadCitationStyleFromBundle = async (
  bundle?: Bundle
): Promise<string | undefined> => {
  if (bundle && bundle.csl && bundle.csl.cslIdentifier) {
    return loadStyle(bundle.csl.cslIdentifier)
  }
}

const loadCitationStyleFromBundleID = async (
  bundleID?: string
): Promise<string | undefined> => {
  const bundles: Bundle[] = await import(
    // @ts-ignore
    '@manuscripts/data/dist/shared/bundles.json'
  )

  const bundle = bundles.find((item) => item._id === bundleID)

  return loadCitationStyleFromBundle(bundle)
}

const buildDependendentStyle = async (
  citationStyleData: string
): Promise<string> => {
  // const parser = CiteProc.setupXml(citationStyleData)

  const doc = new DOMParser().parseFromString(
    citationStyleData,
    'application/xml'
  )

  const parentLink = evaluateXPathToString(
    '/csl:style/csl:info/csl:link[@rel="independent-parent"]/@href',
    doc,
    undefined,
    undefined,
    { namespaceResolver }
  )

  if (parentLink && parentLink.startsWith('http://www.zotero.org/styles/')) {
    // TODO: merge metadata (locales) into parent from child?

    return loadStyle(parentLink)
  }

  return citationStyleData
}

export const loadStyle = async (id: string): Promise<string> => {
  const basename = id.split('/').pop()

  if (!basename) {
    throw new Error(`No style name in ${id}`)
  }

  const styles: Record<string, string> = await import(
    `@manuscripts/csl-styles/dist/${basename[0]}.json`
  )

  if (!styles[id]) {
    throw new Error(`Style ${id} not found`)
  }

  return styles[id]
}
