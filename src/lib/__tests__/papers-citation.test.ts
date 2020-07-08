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

import fs from 'fs'
import path from 'path'

import { parse } from '../papers-citations'

const FIXTURES_DIR = path.join(
  __dirname,
  '..',
  '__fixtures__',
  'papers-citations-xml'
)

describe('Papers Citations XML parser', () => {
  it('should parse all fixtures to CSL JSON correctly', async () => {
    const fixtures = await fs.promises.readdir(FIXTURES_DIR)

    for (const file of fixtures) {
      const xml = await fs.promises.readFile(
        path.join(FIXTURES_DIR, file),
        'utf-8'
      )
      expect(parse(xml)).toMatchSnapshot()
    }
  })
})
