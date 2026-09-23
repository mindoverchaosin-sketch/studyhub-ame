import type { StudyMaterialBlock } from '@/lib/study-material/document-schema'

export type MasteroQualityReport = {
  sourceCoverage: 'high' | 'medium' | 'low'
  technicalConsistency: 'pass' | 'review'
  unsupportedClaims: number
  unsupportedClaimDetails: Array<{
    blockId: string
    reason: string
    severity: 'warning'
  }>
  claimResults: Array<{
    blockId: string
    classification: 'SUPPORTED' | 'PARAPHRASE' | 'UNSUPPORTED' | 'UNCERTAIN'
    reason?: string
  }>
  sourceFidelity: {
    score: number
    supportedClaims: number
    paraphrasedClaims: number
    unsupportedClaims: number
    uncertainClaims: number
  }
  repetition: number
  grammar: 'pass' | 'review'
  structure: 'pass' | 'review'
  warnings: string[]
}

function blockText(block: StudyMaterialBlock): string {
  switch (block.type) {
    case 'heading':
    case 'examTip':
      return block.text
    case 'paragraph':
      return block.children.map((child) => child.text).join(' ')
    case 'list':
      return block.items.join(' ')
    case 'table':
      return [...block.headers, ...block.rows.flat()].join(' ')
    case 'image':
      return `${block.altText} ${block.caption ?? ''}`
    case 'callout':
      return `${block.title} ${block.text}`
    case 'definition':
      return `${block.term} ${block.definition}`
    case 'example':
      return `${block.title} ${block.content}`
    case 'link':
      return `${block.text} ${block.url}`
  }
}

function words(value: string): Set<string> {
  return new Set(value.toLowerCase().match(/[a-z0-9][a-z0-9'-]{2,}/g) ?? [])
}

const technicalClaimPatterns: Array<{ pattern: RegExp; reason: string }> = [
  { pattern: /\b(?:magnetic|non-magnetic|magneti[cs]|corrosion-resistant|corrosion resistance|strength|durability|lighter|heavier|weight reduction|strength-to-weight)\b/i, reason: 'contains a material-property claim not explicitly supported by the supplied source' },
  { pattern: /\b(?:aluminium|aluminum|titanium|copper|steel|iron|magnesium|alloy|alloys)\b/i, reason: 'contains a named technical entity not present in the supplied source' },
  { pattern: /\b(?:faa|easa|icao|far\s*-?\s*\d+|part\s*-?\s*66|regulation|regulatory|standard|compliance)\b/i, reason: 'contains a regulatory or standards claim not present in the supplied source' },
  { pattern: /\b(?:aircraft\s+(?:component|structure|engine|wing|fuselage)|load-bearing|structural component|maintenance procedure|inspection procedure)\b/i, reason: 'contains a specific aircraft, application, or procedure claim not supported by the supplied source' },
]

function sourceHasClaim(source: string, claim: string): boolean {
  const normalizedSource = source.toLowerCase()
  const normalizedClaim = claim.toLowerCase()
  if (normalizedSource.includes(normalizedClaim)) return true
  const sourceTokens = words(source)
  const claimTokens = words(claim)
  const shared = [...claimTokens].filter((token) => sourceTokens.has(token)).length
  return claimTokens.size > 0 && shared / claimTokens.size >= 0.75
}

function classifyBlock(source: string, block: StudyMaterialBlock): 'SUPPORTED' | 'PARAPHRASE' | 'UNSUPPORTED' | 'UNCERTAIN' {
  const text = blockText(block).trim()
  if (!text) return 'UNCERTAIN'
  if (source.toLowerCase().includes(text.toLowerCase())) return 'SUPPORTED'
  const sourceTokens = words(source)
  const claimTokens = words(text)
  const shared = [...claimTokens].filter((token) => sourceTokens.has(token)).length
  const overlap = claimTokens.size ? shared / claimTokens.size : 0
  if (overlap >= 0.65) return 'PARAPHRASE'
  if (overlap < 0.25) return 'UNSUPPORTED'
  return 'UNCERTAIN'
}

export function analyzeMasteroOutput(source: string, blocks: StudyMaterialBlock[]): MasteroQualityReport {
  const generatedText = blocks.map(blockText).join(' ').trim()
  const sourceWords = words(source)
  const generatedWords = words(generatedText)
  const sharedWords = [...generatedWords].filter((word) => sourceWords.has(word)).length
  const coverage = generatedWords.size === 0 ? 0 : sharedWords / generatedWords.size
  const normalizedBlocks = blocks.map((block) => blockText(block).trim().toLowerCase()).filter(Boolean)
  const repetition = normalizedBlocks.length - new Set(normalizedBlocks).size
  const sourceNumbers = new Set(source.match(/\b\d+(?:\.\d+)?\b/g) ?? [])
  const unsupportedClaimDetails: MasteroQualityReport['unsupportedClaimDetails'] = []
  const claimResults: MasteroQualityReport['claimResults'] = []
  blocks.forEach((block) => {
    const text = blockText(block)
    const classification = classifyBlock(source, block)
    claimResults.push({ blockId: block.id, classification })
    const blockNumbers = text.match(/\b\d+(?:\.\d+)?\b/g) ?? []
    blockNumbers.filter((value) => !sourceNumbers.has(value)).forEach((value) => {
      unsupportedClaimDetails.push({ blockId: block.id, reason: `contains numerical claim ${value} not present in the supplied source`, severity: 'warning' })
    })
    technicalClaimPatterns.forEach(({ pattern, reason }) => {
      const match = text.match(pattern)
      if (match && !sourceHasClaim(source, match[0])) unsupportedClaimDetails.push({ blockId: block.id, reason, severity: 'warning' })
    })
    if (classification === 'UNSUPPORTED' || classification === 'UNCERTAIN') {
      claimResults[claimResults.length - 1].reason = classification === 'UNSUPPORTED'
        ? 'adds factual content not present in the supplied source'
        : 'cannot be confidently matched to the supplied source'
    }
  })
  const unsupportedClaims = unsupportedClaimDetails.length
  const warnings: string[] = []
  const supportedClaims = claimResults.filter((claim) => claim.classification === 'SUPPORTED').length
  const paraphrasedClaims = claimResults.filter((claim) => claim.classification === 'PARAPHRASE').length
  const uncertainClaims = claimResults.filter((claim) => claim.classification === 'UNCERTAIN').length

  if (coverage < 0.15) warnings.push('Generated content has low overlap with the supplied source and needs careful review.')
  else if (coverage < 0.35) warnings.push('Generated content has medium source coverage; verify technical meaning before applying.')
  if (unsupportedClaimDetails.some((detail) => detail.reason.startsWith('contains numerical claim'))) warnings.push('One or more numerical claims were not present in the supplied source.')
  unsupportedClaimDetails.filter((detail) => !detail.reason.startsWith('contains numerical claim')).forEach((detail) => warnings.push(`Block ${detail.blockId} ${detail.reason}.`))
  if (repetition > 0) warnings.push('Repeated block content was detected.')
  if (/key fact\s+[123]|this section is important for exam success|aeroprep helps learners|learners build practical understanding/i.test(generatedText)) warnings.push('Generic placeholder or marketing language was detected.')
  if (!blocks.length || !blocks.some((block) => block.type === 'heading' || block.type === 'paragraph' || block.type === 'list')) warnings.push('The generated structure is too sparse for editorial use.')

  const score = claimResults.length === 0
    ? 0
    : Math.round(((supportedClaims + paraphrasedClaims * 0.85) / claimResults.length) * 100)

  return {
    sourceCoverage: coverage >= 0.5 ? 'high' : coverage >= 0.25 ? 'medium' : 'low',
    technicalConsistency: unsupportedClaims === 0 ? 'pass' : 'review',
    unsupportedClaims,
    unsupportedClaimDetails,
    claimResults,
    sourceFidelity: { score, supportedClaims, paraphrasedClaims, unsupportedClaims, uncertainClaims },
    repetition,
    grammar: /\s{2,}|[.!?]{2,}/.test(generatedText) ? 'review' : 'pass',
    structure: blocks.length > 0 && warnings.every((warning) => !warning.includes('structure')) ? 'pass' : 'review',
    warnings,
  }
}
