import type { StudyMaterialBlock, StudyMaterialDocument } from './document-schema'

export const defaultAeroPrepStudyDocument = (title: string): StudyMaterialDocument => {
  const blocks: StudyMaterialBlock[] = [
    {
      id: 'heading-1',
      type: 'heading',
      level: 1,
      text: title,
    },
    {
      id: 'para-1',
      type: 'paragraph',
      children: [
        { text: 'AeroPrep study material is designed to help learners build practical understanding and exam confidence.', format: [] },
      ],
    },
    {
      id: 'callout-1',
      type: 'callout',
      variant: 'important',
      title: 'Important',
      text: 'Use this section to highlight the key point learners must remember for exam success.',
    },
    {
      id: 'list-1',
      type: 'list',
      listType: 'bullet',
      items: ['Key fact 1', 'Key fact 2', 'Key fact 3'],
    },
    {
      id: 'tip-1',
      type: 'examTip',
      text: 'Exam tip: connect the principle to the aircraft scenario or maintenance action being assessed.',
    },
  ]

  return {
    schemaVersion: 1,
    documentType: 'AEROPREP_STUDY_MATERIAL',
    title,
    metadata: {
      status: 'DRAFT',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    pages: [{
      id: 'page-1',
      pageNumber: 1,
      pageType: 'CONTENT',
      title,
      blocks: blocks.map((block) => ({ ...block })),
    }],
    blocks: blocks.map((block) => ({ ...block })),
    branding: {
      systemControlled: true,
      locked: true,
    },
  }
}
