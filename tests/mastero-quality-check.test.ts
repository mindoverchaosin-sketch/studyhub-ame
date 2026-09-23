import { describe, expect, it } from 'vitest'
import { analyzeMasteroOutput } from '@/lib/mastero/quality-check'

describe('Mastero quality check', () => {
  it('flags unsupported numerical claims and generic filler', () => {
    const report = analyzeMasteroOutput('Aircraft materials are classified as ferrous and non-ferrous.', [
      { id: 'one', type: 'paragraph', children: [{ text: 'Key fact 1: aircraft materials have 42 properties.', format: [] }] },
    ])

    expect(report.unsupportedClaims).toBe(2)
    expect(report.technicalConsistency).toBe('review')
    expect(report.warnings.join(' ')).toMatch(/placeholder|numerical/i)
  })

  it('reports strong source overlap without inventing workflow behavior', () => {
    const report = analyzeMasteroOutput('Ferrous materials contain iron and are used in aircraft structures.', [
      { id: 'one', type: 'paragraph', children: [{ text: 'Ferrous materials contain iron and are used in aircraft structures.', format: [] }] },
    ])

    expect(report.sourceCoverage).toBe('high')
    expect(report.unsupportedClaims).toBe(0)
    expect(report.technicalConsistency).toBe('pass')
  })

  it('accepts a faithful paraphrase without flagging it as a new fact', () => {
    const report = analyzeMasteroOutput('Aircraft materials are classified into ferrous and non-ferrous materials.', [
      { id: 'paraphrase', type: 'paragraph', children: [{ text: 'Aerospace materials are divided into ferrous and non-ferrous materials.', format: [] }] },
    ])

    expect(report.unsupportedClaims).toBe(0)
    expect(report.technicalConsistency).toBe('pass')
  })

  it('flags unsupported material properties and named entities by block', () => {
    const report = analyzeMasteroOutput('Aircraft materials are classified into ferrous and non-ferrous materials.', [
      { id: 'property', type: 'paragraph', children: [{ text: 'Ferrous materials are magnetic and include steel.', format: [] }] },
    ])

    expect(report.unsupportedClaimDetails).toEqual(expect.arrayContaining([
      expect.objectContaining({ blockId: 'property', reason: expect.stringMatching(/material-property/) }),
      expect.objectContaining({ blockId: 'property', reason: expect.stringMatching(/named technical entity/) }),
    ]))
    expect(report.technicalConsistency).toBe('review')
  })

  it('accepts source-supported numbers and flags unsupported regulations', () => {
    const report = analyzeMasteroOutput('The material contains 40% iron by mass.', [
      { id: 'supported', type: 'paragraph', children: [{ text: 'The material contains 40% iron by mass.', format: [] }] },
      { id: 'regulation', type: 'paragraph', children: [{ text: 'This complies with EASA Part-66 requirements.', format: [] }] },
    ])

    expect(report.unsupportedClaimDetails.some((detail) => detail.blockId === 'supported' && detail.reason.includes('numerical'))).toBe(false)
    expect(report.unsupportedClaimDetails).toEqual(expect.arrayContaining([
      expect.objectContaining({ blockId: 'regulation', reason: expect.stringMatching(/regulatory/) }),
    ]))
  })
})