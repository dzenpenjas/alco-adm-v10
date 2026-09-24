import { validateAssessmentPackage } from '../src/services/assessmentPackageService';
import type {
  AssessmentPackage,
  WrittenAssessmentInstrument,
  OralAssessmentInstrument,
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
    scale: [{ id: 'sc-1', label: 'Sangat Baik', minScore: 4, maxScore: 4 }],
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
    scale: [{ id: 's-2', label: 'Baik' }],
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

console.log(`\nResults: ${passed} passed, ${failed} failed.`);

if (failed > 0) {
  process.exit(1);
} else {
  console.log('ALL B.1.2p REGRESSION TESTS PASSED!');
  process.exit(0);
}
