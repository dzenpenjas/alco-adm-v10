import fs from 'fs';
import path from 'path';
import { validateAssessmentPackage, invalidateAssessmentPackageDependencies } from '../src/services/assessmentPackageService';
import type {
  AssessmentPackage,
  WrittenAssessmentInstrument,
  OralAssessmentInstrument,
  PerformanceAssessmentInstrument,
  ObservationAssessmentInstrument,
  SelfPeerAssessmentInstrument,
  AcademicSetting,
  AssessmentPlan,
  TPData,
  AssessmentRubric,
  AssessmentScoringGuide,
  AssessmentAnswerKey,
} from '../src/types';

let passed = 0;
let failed = 0;

function assert(condition: boolean, message: string) {
  if (condition) {
    passed++;
    console.log(`✓ ${message}`);
  } else {
    failed++;
    console.error(`✗ FAIL: ${message}`);
  }
}

const mockSetting: AcademicSetting = {
  id: 'setting-1',
  profileId: 'prof-1',
  curriculum: 'Kurikulum Merdeka',
  academicYear: '2025/2026',
  semester: '1 (Ganjil)',
  level: 'SMA',
  grade: 'Kelas 10',
  phase: 'E',
  subject: 'PJOK',
  updatedAt: new Date().toISOString(),
};

const mockTP: TPData = {
  id: 'tp-data-1',
  academicSettingId: 'setting-1',
  items: [
    {
      id: 'tp-1',
      code: 'TP-1',
      statement: 'Siswa mampu mendemonstrasikan teknik dasar basket',
      competence: 'Mendemonstrasikan',
      contentScope: 'Bola Basket',
      p3Dimensions: [],
      order: 1,
    },
  ],
  workflowStatus: 'SIAP',
  needsReview: false,
  updatedAt: new Date().toISOString(),
};

const mockPlan: AssessmentPlan = {
  id: 'plan-1',
  academicSettingId: 'setting-1',
  workspaceId: 'ws-1',
  title: 'Rencana Asesmen Utama',
  purpose: 'SUMMATIVE',
  timing: 'POST',
  scopeType: 'TP',
  tpIds: ['tp-1'],
  criterionIds: [],
  instruments: [{ id: 'inst-written-1', type: 'WRITTEN_TEST', label: 'Tes Tertulis' }],
  workflowStatus: 'SIAP',
  needsReview: false,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const mockContext = {
  academicSetting: mockSetting,
  assessmentPlan: mockPlan,
  tp: mockTP,
};

function createValidPackage(): AssessmentPackage {
  const instId = 'inst-written-1';
  const mcItemId = 'item-mc-1';
  const essayItemId = 'item-essay-1';

  const inst: WrittenAssessmentInstrument = {
    id: instId,
    type: 'WRITTEN_TEST',
    title: 'Tes Tertulis Utama',
    items: [
      {
        id: mcItemId,
        itemType: 'MULTIPLE_CHOICE',
        prompt: 'Siapa penemu bola basket?',
        options: [
          { id: 'opt-a', label: 'A', text: 'James Naismith' },
          { id: 'opt-b', label: 'B', text: 'William G. Morgan' },
        ],
        order: 1,
      },
      {
        id: essayItemId,
        itemType: 'ESSAY',
        prompt: 'Jelaskan sejarah singkat permainan bola basket!',
        order: 2,
      },
    ],
  };

  const akMc: AssessmentAnswerKey = {
    id: 'ak-1',
    instrumentId: instId,
    instrumentItemId: mcItemId,
    answerType: 'OPTION',
    optionIds: ['opt-a'],
  };

  const akEssay: AssessmentAnswerKey = {
    id: 'ak-2',
    instrumentId: instId,
    instrumentItemId: essayItemId,
    answerType: 'EXPECTED_RESPONSE',
    value: 'Bola basket diciptakan oleh Dr. James Naismith pada tahun 1891.',
  };

  const rub: AssessmentRubric = {
    id: 'rub-1',
    title: 'Rubrik Tes Tertulis',
    criteria: [{ id: 'crit-1', label: 'Keakuratan Pemahaman' }],
    scale: [{ id: 'sc-1', label: 'Sangat Baik', score: 4, order: 1 }],
    instrumentId: instId,
    instrumentItemId: essayItemId,
  };

  const sg: AssessmentScoringGuide = {
    id: 'sg-1',
    title: 'Pedoman Penskoran Tes Uraian',
    guideType: 'ESSAY',
    instructions: 'Jawaban tepat mendapatkan poin penuh.',
    maxScore: 10,
    instrumentId: instId,
    instrumentItemId: essayItemId,
  };

  return {
    id: 'pkg-plan-1',
    assessmentPlanId: 'plan-1',
    academicSettingId: 'setting-1',
    workspaceId: 'ws-1',
    title: 'Perangkat Asesmen Utama',
    blueprintItems: [
      {
        id: 'bp-1',
        objectiveRefId: 'tp-1',
        instrumentType: 'WRITTEN_TEST',
        instrumentItemIds: [mcItemId, essayItemId],
        assessmentIndicator: 'Indikator 1',
        order: 1,
      },
    ],
    instruments: [inst],
    answerKeys: [akMc, akEssay],
    rubrics: [rub],
    scoringGuides: [sg],
    workflowStatus: 'DRAFT',
    needsReview: false,
    revision: 1,
    provenance: { generatedBy: 'USER', generatedAt: new Date().toISOString() },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

console.log('=== B.1.2p Canonical ID, Reference & Scope Integrity Regression Tests ===\n');

// Test 1: Valid canonical package passes
{
  const pkg = createValidPackage();
  const res = validateAssessmentPackage(pkg, mockContext);
  assert(res.valid, 'Test 1: Valid package passes validation');
  assert(res.errors.length === 0, `Test 1: 0 errors expected, got ${res.errors.length}: ${res.errors.join('; ')}`);
}

// Test 2: Duplicate instrument ID
{
  const pkg = createValidPackage();
  pkg.instruments.push({
    id: 'inst-written-1', // duplicate!
    type: 'ORAL_TEST',
    title: 'Tes Lisan',
  } as OralAssessmentInstrument);
  const res = validateAssessmentPackage(pkg, mockContext);
  assert(!res.valid, 'Test 2: Duplicate instrument ID fails validation');
  assert(
    res.errors.some((e) => e.includes('duplicate instrument.id canonical')),
    'Test 2: Contains duplicate instrument ID error message'
  );
}

// Test 3: Empty instrument ID
{
  const pkg = createValidPackage();
  pkg.instruments[0].id = '';
  const res = validateAssessmentPackage(pkg, mockContext);
  assert(!res.valid, 'Test 3: Empty instrument ID fails validation');
  assert(
    res.errors.some((e) => e.includes('belum memiliki id canonical')),
    'Test 3: Contains empty instrument ID error message'
  );
}

// Test 4: Duplicate Item ID across instruments
{
  const pkg = createValidPackage();
  const oralInst: OralAssessmentInstrument = {
    id: 'inst-oral-1',
    type: 'ORAL_TEST',
    title: 'Tes Lisan Utama',
    items: [
      {
        id: 'item-mc-1', // duplicate item ID!
        prompt: 'Pertanyaan lisan?',
        order: 1,
      },
    ],
  };
  pkg.instruments.push(oralInst);

  // Update plan to include ORAL_TEST
  const planWithOral: AssessmentPlan = {
    ...mockPlan,
    instruments: [
      { id: 'inst-written-1', type: 'WRITTEN_TEST', label: 'Tes Tertulis' },
      { id: 'inst-oral-1', type: 'ORAL_TEST', label: 'Tes Lisan' },
    ],
  };

  const res = validateAssessmentPackage(pkg, { ...mockContext, assessmentPlan: planWithOral });
  assert(!res.valid, 'Test 4: Duplicate Item ID across instruments fails validation');
  assert(
    res.errors.some((e) => e.includes('duplicate canonical instrument item id')),
    'Test 4: Contains duplicate item ID error message'
  );
}

// Test 5: Empty Item ID
{
  const pkg = createValidPackage();
  (pkg.instruments[0] as WrittenAssessmentInstrument).items![0].id = '  ';
  const res = validateAssessmentPackage(pkg, mockContext);
  assert(!res.valid, 'Test 5: Empty item ID fails validation');
  assert(
    res.errors.some((e) => e.includes('belum memiliki id canonical')),
    'Test 5: Contains empty item ID error message'
  );
}

// Test 6: Duplicate AnswerKey ID
{
  const pkg = createValidPackage();
  pkg.answerKeys.push({
    id: 'ak-1', // duplicate!
    instrumentId: 'inst-written-1',
    instrumentItemId: 'item-mc-1',
    answerType: 'OPTION',
    optionIds: ['opt-a'],
  });
  const res = validateAssessmentPackage(pkg, mockContext);
  assert(!res.valid, 'Test 6: Duplicate AnswerKey ID fails validation');
  assert(
    res.errors.some((e) => e.includes('duplicate AssessmentAnswerKey.id canonical')),
    'Test 6: Contains duplicate AnswerKey ID error message'
  );
}

// Test 7: Empty AnswerKey ID
{
  const pkg = createValidPackage();
  pkg.answerKeys[0].id = '';
  const res = validateAssessmentPackage(pkg, mockContext);
  assert(!res.valid, 'Test 7: Empty AnswerKey ID fails validation');
  assert(
    res.errors.some((e) => e.includes('belum memiliki id canonical')),
    'Test 7: Contains empty AnswerKey ID error message'
  );
}

// Test 8: Duplicate Rubric ID
{
  const pkg = createValidPackage();
  pkg.rubrics.push({
    id: 'rub-1', // duplicate!
    title: 'Rubrik Kedua',
    criteria: [{ id: 'c-2', label: 'Kriteria 2' }],
    scale: [{ id: 's-2', label: 'Baik', order: 1 }],
  });
  const res = validateAssessmentPackage(pkg, mockContext);
  assert(!res.valid, 'Test 8: Duplicate Rubric ID fails validation');
  assert(
    res.errors.some((e) => e.includes('duplicate AssessmentRubric.id canonical')),
    'Test 8: Contains duplicate Rubric ID error message'
  );
}

// Test 9: Empty Rubric ID
{
  const pkg = createValidPackage();
  pkg.rubrics[0].id = ' ';
  const res = validateAssessmentPackage(pkg, mockContext);
  assert(!res.valid, 'Test 9: Empty Rubric ID fails validation');
  assert(
    res.errors.some((e) => e.includes('belum memiliki id canonical')),
    'Test 9: Contains empty Rubric ID error message'
  );
}

// Test 10: Duplicate ScoringGuide ID
{
  const pkg = createValidPackage();
  pkg.scoringGuides.push({
    id: 'sg-1', // duplicate!
    title: 'Pedoman Kedua',
    guideType: 'RUBRIC_BASED',
  });
  const res = validateAssessmentPackage(pkg, mockContext);
  assert(!res.valid, 'Test 10: Duplicate ScoringGuide ID fails validation');
  assert(
    res.errors.some((e) => e.includes('duplicate AssessmentScoringGuide.id canonical')),
    'Test 10: Contains duplicate ScoringGuide ID error message'
  );
}

// Test 11: Empty ScoringGuide ID
{
  const pkg = createValidPackage();
  pkg.scoringGuides[0].id = '';
  const res = validateAssessmentPackage(pkg, mockContext);
  assert(!res.valid, 'Test 11: Empty ScoringGuide ID fails validation');
  assert(
    res.errors.some((e) => e.includes('belum memiliki id canonical')),
    'Test 11: Contains empty ScoringGuide ID error message'
  );
}

// Test 12: Rubric with instrumentItemId without instrumentId
{
  const pkg = createValidPackage();
  pkg.rubrics[0].instrumentId = undefined;
  const res = validateAssessmentPackage(pkg, mockContext);
  assert(!res.valid, 'Test 12: Rubric with instrumentItemId without instrumentId fails validation');
  assert(
    res.errors.some((e) => e.includes('tanpa instrumentId')),
    'Test 12: Contains missing instrumentId error message'
  );
}

// Test 13: Rubric with instrumentItemId belonging to another instrument
{
  const pkg = createValidPackage();
  pkg.rubrics[0].instrumentId = 'inst-other-99'; // wrong instrument ID!
  const res = validateAssessmentPackage(pkg, mockContext);
  assert(!res.valid, 'Test 13: Rubric with cross-instrument item ownership fails validation');
  assert(
    res.errors.some((e) => e.includes('tidak ditemukan') || e.includes('milik instrumen lain')),
    'Test 13: Contains cross-instrument ownership error message'
  );
}

// Test 14: Instrument-level rubric (has instrumentId, no instrumentItemId) -> PASS
{
  const pkg = createValidPackage();
  pkg.rubrics[0].instrumentItemId = undefined;
  const res = validateAssessmentPackage(pkg, mockContext);
  assert(res.valid, 'Test 14: Instrument-level rubric is valid');
}

// Test 15: Package-level rubric (no instrumentId, no instrumentItemId) -> PASS
{
  const pkg = createValidPackage();
  pkg.rubrics[0].instrumentId = undefined;
  pkg.rubrics[0].instrumentItemId = undefined;
  const res = validateAssessmentPackage(pkg, mockContext);
  assert(res.valid, 'Test 15: Package-level rubric is valid');
}

// Test 16: Package academicSettingId mismatch with context.academicSetting.id
{
  const pkg = createValidPackage();
  pkg.academicSettingId = 'setting-mismatch';
  const res = validateAssessmentPackage(pkg, mockContext);
  assert(!res.valid, 'Test 16: academicSettingId mismatch with context fails validation');
  assert(
    res.errors.some((e) => e.includes('academicSettingId Perangkat Asesmen')),
    'Test 16: Contains academicSettingId mismatch error message'
  );
}

// Test 17: Package workspaceId mismatch with context.assessmentPlan.workspaceId
{
  const pkg = createValidPackage();
  pkg.workspaceId = 'ws-mismatch';
  const res = validateAssessmentPackage(pkg, mockContext);
  assert(!res.valid, 'Test 17: workspaceId mismatch with context fails validation');
  assert(
    res.errors.some((e) => e.includes('workspaceId Perangkat Asesmen')),
    'Test 17: Contains workspaceId mismatch error message'
  );
}

// Test 18: Zero type escapes enforced
{
  const servicePath = path.resolve(process.cwd(), 'src/services/assessmentPackageService.ts');
  const testPath = path.resolve(process.cwd(), 'scripts/testB12pCanonicalIdentityScopeIntegrityRegression.ts');
  
  const serviceCode = fs.readFileSync(servicePath, 'utf8');
  const testCode = fs.readFileSync(testPath, 'utf8');

  const forbidden = [
    'as ' + 'any',
    'as ' + 'unknown ' + 'as',
    '@ts-' + 'ignore',
    '@ts-' + 'expect-error',
  ];
  
  const hasServiceEscapes = forbidden.some((pat) => serviceCode.includes(pat));
  const hasTestEscapes = forbidden.some((pat) => testCode.includes(pat));

  assert(!hasServiceEscapes, 'Test 18: Zero type escapes in assessmentPackageService.ts');
  assert(!hasTestEscapes, 'Test 18: Zero type escapes in B.1.2p test script');
}

// Test 19: invalidateAssessmentPackageDependencies passes on valid package
{
  const pkg = createValidPackage();
  const res = invalidateAssessmentPackageDependencies(pkg, mockContext);
  assert(!res.isInvalidated, 'Test 19: Invalidation passes on valid package');
  assert(res.reasons.length === 0, `Test 19: 0 reasons expected, got ${res.reasons.length}: ${res.reasons.join('; ')}`);
}

// Test 20: invalidateAssessmentPackageDependencies fails on duplicate instrument ID
{
  const pkg = createValidPackage();
  pkg.instruments.push({
    id: 'inst-written-1', // duplicate!
    type: 'ORAL_TEST',
    title: 'Tes Lisan',
  } as OralAssessmentInstrument);
  const res = invalidateAssessmentPackageDependencies(pkg, mockContext);
  assert(res.isInvalidated, 'Test 20: Duplicate instrument ID invalidates package');
  assert(
    res.reasons.some((r) => r.includes('Duplicate instrument ID')),
    'Test 20: Contains duplicate instrument ID reason'
  );
}

// Test 21: invalidateAssessmentPackageDependencies fails on empty instrument ID
{
  const pkg = createValidPackage();
  pkg.instruments[0].id = '';
  const res = invalidateAssessmentPackageDependencies(pkg, mockContext);
  assert(res.isInvalidated, 'Test 21: Empty instrument ID invalidates package');
  assert(
    res.reasons.some((r) => r.includes('tanpa id canonical')),
    'Test 21: Contains empty instrument ID reason'
  );
}

// Test 22: invalidateAssessmentPackageDependencies fails on duplicate item ID across instruments
{
  const pkg = createValidPackage();
  const oralInst: OralAssessmentInstrument = {
    id: 'inst-oral-1',
    type: 'ORAL_TEST',
    title: 'Tes Lisan Utama',
    items: [
      {
        id: 'item-mc-1', // duplicate item ID!
        prompt: 'Pertanyaan lisan?',
        order: 1,
      },
    ],
  };
  pkg.instruments.push(oralInst);
  const res = invalidateAssessmentPackageDependencies(pkg, mockContext);
  assert(res.isInvalidated, 'Test 22: Duplicate item ID across instruments invalidates package');
  assert(
    res.reasons.some((r) => r.includes('Duplicate instrument item ID')),
    'Test 22: Contains duplicate item ID reason'
  );
}

// Test 23: invalidateAssessmentPackageDependencies fails on empty item ID
{
  const pkg = createValidPackage();
  (pkg.instruments[0] as WrittenAssessmentInstrument).items![0].id = '';
  const res = invalidateAssessmentPackageDependencies(pkg, mockContext);
  assert(res.isInvalidated, 'Test 23: Empty item ID invalidates package');
  assert(
    res.reasons.some((r) => r.includes('tanpa id canonical')),
    'Test 23: Contains empty item ID reason'
  );
}

// Test 24: invalidateAssessmentPackageDependencies fails on duplicate item ID in WRITTEN_TEST
{
  const pkg = createValidPackage();
  const writtenInst = pkg.instruments[0] as WrittenAssessmentInstrument;
  writtenInst.items!.push({
    id: 'item-mc-1', // duplicate in same written instrument!
    itemType: 'SHORT_ANSWER',
    prompt: 'Soal isian duplikat',
    order: 3,
  });
  const res = invalidateAssessmentPackageDependencies(pkg, mockContext);
  assert(res.isInvalidated, 'Test 24: Duplicate item ID in same written test invalidates package');
  assert(
    res.reasons.some((r) => r.includes('Duplicate instrument item ID')),
    'Test 24: Contains duplicate item ID reason'
  );
}

// Test 25: invalidateAssessmentPackageDependencies fails on duplicate aspect ID in PERFORMANCE
{
  const pkg = createValidPackage();
  const perfInst: PerformanceAssessmentInstrument = {
    id: 'inst-perf-1',
    type: 'PERFORMANCE',
    title: 'Unjuk Kerja',
    task: 'Praktik Basket',
    aspects: [
      { id: 'item-mc-1', label: 'Aspek 1' }, // duplicate ID with mc item!
    ],
  };
  pkg.instruments.push(perfInst);
  const res = invalidateAssessmentPackageDependencies(pkg, mockContext);
  assert(res.isInvalidated, 'Test 25: Duplicate aspect ID in PERFORMANCE invalidates package');
  assert(
    res.reasons.some((r) => r.includes('Duplicate instrument item ID')),
    'Test 25: Contains duplicate aspect ID reason'
  );
}

// Test 26: invalidateAssessmentPackageDependencies fails on duplicate aspect ID in OBSERVATION
{
  const pkg = createValidPackage();
  const obsInst: ObservationAssessmentInstrument = {
    id: 'inst-obs-1',
    type: 'OBSERVATION',
    title: 'Lembar Observasi',
    aspects: [
      { id: 'item-mc-1', label: 'Aspek Obs' }, // duplicate ID!
    ],
  };
  pkg.instruments.push(obsInst);
  const res = invalidateAssessmentPackageDependencies(pkg, mockContext);
  assert(res.isInvalidated, 'Test 26: Duplicate aspect ID in OBSERVATION invalidates package');
  assert(
    res.reasons.some((r) => r.includes('Duplicate instrument item ID')),
    'Test 26: Contains duplicate aspect ID reason'
  );
}

// Test 27: invalidateAssessmentPackageDependencies fails on duplicate item ID in SELF_ASSESSMENT
{
  const pkg = createValidPackage();
  const selfInst: SelfPeerAssessmentInstrument = {
    id: 'inst-self-1',
    type: 'SELF_ASSESSMENT',
    title: 'Penilaian Diri',
    items: [
      { id: 'item-mc-1', statement: 'Pernyataan Diri' }, // duplicate ID!
    ],
  };
  pkg.instruments.push(selfInst);
  const res = invalidateAssessmentPackageDependencies(pkg, mockContext);
  assert(res.isInvalidated, 'Test 27: Duplicate item ID in SELF_ASSESSMENT invalidates package');
  assert(
    res.reasons.some((r) => r.includes('Duplicate instrument item ID')),
    'Test 27: Contains duplicate item ID reason'
  );
}

// Test 28: invalidateAssessmentPackageDependencies fails on duplicate item ID in PEER_ASSESSMENT
{
  const pkg = createValidPackage();
  const peerInst: SelfPeerAssessmentInstrument = {
    id: 'inst-peer-1',
    type: 'PEER_ASSESSMENT',
    title: 'Penilaian Antarteman',
    items: [
      { id: 'item-mc-1', statement: 'Pernyataan Antarteman' }, // duplicate ID!
    ],
  };
  pkg.instruments.push(peerInst);
  const res = invalidateAssessmentPackageDependencies(pkg, mockContext);
  assert(res.isInvalidated, 'Test 28: Duplicate item ID in PEER_ASSESSMENT invalidates package');
  assert(
    res.reasons.some((r) => r.includes('Duplicate instrument item ID')),
    'Test 28: Contains duplicate item ID reason'
  );
}

// Test 29: Invalidation - answer key referencing deleted instrument
{
  const pkg = createValidPackage();
  pkg.answerKeys[0].instrumentId = 'inst-non-existent';
  const res = invalidateAssessmentPackageDependencies(pkg, mockContext);
  assert(res.isInvalidated, 'Test 29: Answer key referencing deleted instrument invalidates package');
  assert(
    res.reasons.some((r) => r.includes('instrumentId [inst-non-existent] yang telah dihapus')),
    'Test 29: Contains deleted instrument ID reason'
  );
}

// Test 30: Invalidation - answer key referencing deleted item
{
  const pkg = createValidPackage();
  pkg.answerKeys[0].instrumentItemId = 'item-deleted-99';
  const res = invalidateAssessmentPackageDependencies(pkg, mockContext);
  assert(res.isInvalidated, 'Test 30: Answer key referencing deleted item invalidates package');
  assert(
    res.reasons.some((r) => r.includes('butir [item-deleted-99] yang telah dihapus')),
    'Test 30: Contains deleted item ID reason'
  );
}

// Test 31: Invalidation - answer key cross-instrument reference
{
  const pkg = createValidPackage();
  const oralInst: OralAssessmentInstrument = {
    id: 'inst-oral-2',
    type: 'ORAL_TEST',
    title: 'Tes Lisan 2',
    items: [{ id: 'item-oral-2', prompt: 'Prompt', order: 1 }],
  };
  pkg.instruments.push(oralInst);
  pkg.answerKeys[0].instrumentId = 'inst-oral-2';
  const res = invalidateAssessmentPackageDependencies(pkg, mockContext);
  assert(res.isInvalidated, 'Test 31: Answer key with cross-instrument reference invalidates package');
  assert(
    res.reasons.some((r) => r.includes('cross-instrument reference')),
    'Test 31: Contains cross-instrument reference reason'
  );
}

// Test 32: Invalidation - answer key referencing deleted option ID
{
  const pkg = createValidPackage();
  pkg.answerKeys[0].optionIds = ['opt-deleted-99'];
  const res = invalidateAssessmentPackageDependencies(pkg, mockContext);
  assert(res.isInvalidated, 'Test 32: Answer key referencing deleted option ID invalidates package');
  assert(
    res.reasons.some((r) => r.includes('opsi ID [opt-deleted-99] yang telah dihapus')),
    'Test 32: Contains deleted option ID reason'
  );
}

// Test 33: Invalidation - answer key referencing deleted matching premise
{
  const pkg = createValidPackage();
  const writtenInst = pkg.instruments[0] as WrittenAssessmentInstrument;
  writtenInst.items!.push({
    id: 'item-match-1',
    itemType: 'MATCHING',
    prompt: 'Menjodohkan',
    matchingPremises: [{ id: 'prem-1', text: 'Premis 1' }],
    matchingResponses: [{ id: 'resp-1', text: 'Respon 1' }],
    order: 3,
  });
  pkg.answerKeys.push({
    id: 'ak-match-1',
    instrumentId: writtenInst.id,
    instrumentItemId: 'item-match-1',
    answerType: 'MATCHING',
    matchingPairs: [{ premiseId: 'prem-deleted', responseId: 'resp-1' }],
  });
  const res = invalidateAssessmentPackageDependencies(pkg, mockContext);
  assert(res.isInvalidated, 'Test 33: Answer key referencing deleted matching premise invalidates package');
  assert(
    res.reasons.some((r) => r.includes('premis [prem-deleted] yang telah dihapus')),
    'Test 33: Contains deleted premise ID reason'
  );
}

// Test 34: Invalidation - answer key referencing deleted matching response
{
  const pkg = createValidPackage();
  const writtenInst = pkg.instruments[0] as WrittenAssessmentInstrument;
  writtenInst.items!.push({
    id: 'item-match-2',
    itemType: 'MATCHING',
    prompt: 'Menjodohkan 2',
    matchingPremises: [{ id: 'prem-2', text: 'Premis 2' }],
    matchingResponses: [{ id: 'resp-2', text: 'Respon 2' }],
    order: 3,
  });
  pkg.answerKeys.push({
    id: 'ak-match-2',
    instrumentId: writtenInst.id,
    instrumentItemId: 'item-match-2',
    answerType: 'MATCHING',
    matchingPairs: [{ premiseId: 'prem-2', responseId: 'resp-deleted' }],
  });
  const res = invalidateAssessmentPackageDependencies(pkg, mockContext);
  assert(res.isInvalidated, 'Test 34: Answer key referencing deleted matching response invalidates package');
  assert(
    res.reasons.some((r) => r.includes('respon [resp-deleted] yang telah dihapus')),
    'Test 34: Contains deleted response ID reason'
  );
}

// Test 35: Invalidation - answer key referencing deleted category statement
{
  const pkg = createValidPackage();
  const writtenInst = pkg.instruments[0] as WrittenAssessmentInstrument;
  writtenInst.items!.push({
    id: 'item-cat-1',
    itemType: 'CATEGORY_RESPONSE',
    prompt: 'Kategori 1',
    categoryResponseCategories: [{ id: 'cat-1', label: 'Benar' }],
    categoryResponseStatements: [{ id: 'stmt-1', text: 'Pernyataan 1' }],
    order: 3,
  });
  pkg.answerKeys.push({
    id: 'ak-cat-1',
    instrumentId: writtenInst.id,
    instrumentItemId: 'item-cat-1',
    answerType: 'CATEGORY_RESPONSE',
    categoryAnswers: [{ statementId: 'stmt-deleted', categoryId: 'cat-1' }],
  });
  const res = invalidateAssessmentPackageDependencies(pkg, mockContext);
  assert(res.isInvalidated, 'Test 35: Answer key referencing deleted category statement invalidates package');
  assert(
    res.reasons.some((r) => r.includes('pernyataan [stmt-deleted] yang telah dihapus')),
    'Test 35: Contains deleted statement ID reason'
  );
}

// Test 36: Invalidation - answer key referencing deleted category ID
{
  const pkg = createValidPackage();
  const writtenInst = pkg.instruments[0] as WrittenAssessmentInstrument;
  writtenInst.items!.push({
    id: 'item-cat-2',
    itemType: 'CATEGORY_RESPONSE',
    prompt: 'Kategori 2',
    categoryResponseCategories: [{ id: 'cat-2', label: 'Benar' }],
    categoryResponseStatements: [{ id: 'stmt-2', text: 'Pernyataan 2' }],
    order: 3,
  });
  pkg.answerKeys.push({
    id: 'ak-cat-2',
    instrumentId: writtenInst.id,
    instrumentItemId: 'item-cat-2',
    answerType: 'CATEGORY_RESPONSE',
    categoryAnswers: [{ statementId: 'stmt-2', categoryId: 'cat-deleted' }],
  });
  const res = invalidateAssessmentPackageDependencies(pkg, mockContext);
  assert(res.isInvalidated, 'Test 36: Answer key referencing deleted category ID invalidates package');
  assert(
    res.reasons.some((r) => r.includes('kategori [cat-deleted] yang telah dihapus')),
    'Test 36: Contains deleted category ID reason'
  );
}

// Test 37: Invalidation - instrument referencing deleted rubricId
{
  const pkg = createValidPackage();
  (pkg.instruments[0] as WrittenAssessmentInstrument & { rubricId?: string }).rubricId = 'rub-deleted-99';
  const res = invalidateAssessmentPackageDependencies(pkg, mockContext);
  assert(res.isInvalidated, 'Test 37: Instrument referencing deleted rubricId invalidates package');
  assert(
    res.reasons.some((r) => r.includes('rubricId [rub-deleted-99] yang telah dihapus')),
    'Test 37: Contains deleted rubricId reason'
  );
}

// Test 38: Invalidation - instrument referencing deleted scoringGuideId
{
  const pkg = createValidPackage();
  (pkg.instruments[0] as WrittenAssessmentInstrument & { scoringGuideId?: string }).scoringGuideId = 'sg-deleted-99';
  const res = invalidateAssessmentPackageDependencies(pkg, mockContext);
  assert(res.isInvalidated, 'Test 38: Instrument referencing deleted scoringGuideId invalidates package');
  assert(
    res.reasons.some((r) => r.includes('scoringGuideId [sg-deleted-99] yang telah dihapus')),
    'Test 38: Contains deleted scoringGuideId reason'
  );
}

// Test 39: Invalidation - blueprint referencing deleted TP
{
  const pkg = createValidPackage();
  pkg.blueprintItems[0].objectiveRefId = 'tp-deleted-99';
  const res = invalidateAssessmentPackageDependencies(pkg, mockContext);
  assert(res.isInvalidated, 'Test 39: Blueprint referencing deleted TP invalidates package');
  assert(
    res.reasons.some((r) => r.includes('tidak valid atau telah dihapus di hulu')),
    'Test 39: Contains deleted TP reference reason'
  );
}

// Test 40: Invalidation - blueprint referencing invalid KKTP criterion
{
  const pkg = createValidPackage();
  pkg.blueprintItems[0].criterionId = 'crit-deleted-99';
  const res = invalidateAssessmentPackageDependencies(pkg, {
    ...mockContext,
    assessmentCriteria: [
      {
        id: 'crit-valid-1',
        academicSettingId: 'setting-1',
        tpId: 'tp-1',
        description: 'Kriteria 1',
        approach: 'skala_interval',
        indicators: [],
        levels: [],
        workflowStatus: 'SIAP',
        needsReview: false,
        updatedAt: new Date().toISOString(),
      },
    ],
  });
  assert(res.isInvalidated, 'Test 40: Blueprint referencing deleted criterion invalidates package');
  assert(
    res.reasons.some((r) => r.includes('tidak lagi ditemukan pada sumber kriteria')),
    'Test 40: Contains missing criterion reason'
  );
}

console.log(`\nResults: ${passed} passed, ${failed} failed.`);

if (failed > 0) {
  process.exit(1);
} else {
  console.log('ALL B.1.2p REGRESSION TESTS PASSED!');
  process.exit(0);
}
