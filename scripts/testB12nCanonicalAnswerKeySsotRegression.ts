import {
  AssessmentPackage,
  AcademicSetting,
  AssessmentPlan,
  AssessmentBlueprintItem,
  WrittenAssessmentInstrument,
  MatchingAssessmentEntry,
  CategoryResponseCategory,
  CategoryResponseStatement,
  AssessmentAnswerKey,
  TPData,
  TeacherProfile,
  SchoolData,
} from '../src/types';
import { validateAssessmentPackage } from '../src/services/assessmentPackageService';

function runB12nTests() {
  console.log('--- START B.1.2n CANONICAL ANSWER KEY SSOT REGRESSION TESTS ---');

  const mockSetting: AcademicSetting = {
    id: 'setting-1',
    profileId: 'prof-1',
    curriculum: 'Kurikulum Merdeka',
    academicYear: '2025/2026',
    semester: '1 (Ganjil)',
    level: 'SD',
    grade: 'Kelas 4',
    phase: 'B',
    subject: 'PJOK',
    updatedAt: new Date().toISOString(),
  };

  const mockProfile: TeacherProfile = {
    id: 'prof-1',
    name: 'Guru Penjas',
    nip: '198501012010011001',
    status: 'PNS',
    defaultLevel: 'SD',
    defaultSubject: 'PJOK',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const mockSchool: SchoolData = {
    id: 'sch-1',
    name: 'SD Negeri 1 Merdeka',
    address: 'Jl. Olahraga No. 1',
    npsn: '12345678',
    village: 'Merdeka',
    district: 'Kecamatan Penjas',
    regency: 'Kota Surakarta',
    province: 'Jawa Tengah',
    principalName: 'Kepala Sekolah M.Pd',
    principalNip: '197501012000031001',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const mockTP: TPData = {
    id: 'tp-data-1',
    academicSettingId: 'setting-1',
    items: [
      {
        id: 'tp-1',
        code: 'TP-1',
        statement: 'Mempraktikkan variasi pola gerak dasar lokomotor',
        competence: 'Mempraktikkan',
        contentScope: 'Gerak Lokomotor',
        p3Dimensions: [],
        order: 1,
      },
    ],
    workflowStatus: 'SIAP',
    needsReview: false,
    updatedAt: new Date().toISOString(),
  };

  const mockAssessmentPlan: AssessmentPlan = {
    id: 'plan-1',
    academicSettingId: 'setting-1',
    title: 'Penilaian Sumatif Bab 1 Gerak Dasar',
    purpose: 'SUMMATIVE',
    timing: 'POST',
    scopeType: 'TP',
    tpIds: ['tp-1'],
    criterionIds: [],
    instruments: [{ id: 'inst-w', type: 'WRITTEN_TEST', label: 'Tes Tertulis' }],
    workflowStatus: 'SIAP',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const defaultContext = {
    academicSetting: mockSetting,
    assessmentPlan: mockAssessmentPlan,
    tp: mockTP,
    teacherProfile: mockProfile,
    schoolData: mockSchool,
  };

  const baseBlueprint: AssessmentBlueprintItem[] = [
    { id: 'bp-1', objectiveRefId: 'tp-1', instrumentType: 'WRITTEN_TEST', instrumentItemIds: ['item-mc-1'], order: 1 },
  ];

  // TEST 1: MULTIPLE_CHOICE with canonical AssessmentAnswerKey -> PASS
  console.log('Test 1: MULTIPLE_CHOICE with valid canonical AssessmentAnswerKey -> PASS');
  const pkgMcValid: AssessmentPackage = {
    id: 'pkg-1',
    assessmentPlanId: 'plan-1',
    academicSettingId: 'setting-1',
    title: 'Paket Asesmen MC Valid',
    blueprintItems: baseBlueprint,
    instruments: [
      {
        id: 'inst-w',
        type: 'WRITTEN_TEST',
        items: [
          {
            id: 'item-mc-1',
            itemType: 'MULTIPLE_CHOICE',
            prompt: 'Berikut yang termasuk gerak lokomotor adalah...',
            order: 1,
            options: [
              { id: 'opt-a', label: 'A', text: 'Berlari' },
              { id: 'opt-b', label: 'B', text: 'Mengayun tangan' },
              { id: 'opt-c', label: 'C', text: 'Meliukkan badan' },
            ],
          },
        ],
      },
    ],
    answerKeys: [
      {
        id: 'ak-1',
        instrumentId: 'inst-w',
        instrumentItemId: 'item-mc-1',
        answerType: 'OPTION',
        optionIds: ['opt-a'],
      },
    ],
    scoringGuides: [],
    rubrics: [],
    workflowStatus: 'DRAFT',
    revision: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const val1 = validateAssessmentPackage(pkgMcValid, defaultContext);
  if (!val1.valid) {
    throw new Error(`Test 1 Failed: Expected valid package, got errors: ${val1.errors.join('; ')}`);
  }
  console.log('  PASSED: Valid canonical answer key for MULTIPLE_CHOICE accepted.');

  // TEST 2: MULTIPLE_CHOICE without AssessmentAnswerKey (even if legacy isCorrect is set) -> FAIL
  console.log('Test 2: MULTIPLE_CHOICE without canonical AssessmentAnswerKey (legacy isCorrect only) -> FAIL');
  const pkgMcNoAk: AssessmentPackage = {
    ...pkgMcValid,
    instruments: [
      {
        id: 'inst-w',
        type: 'WRITTEN_TEST',
        items: [
          {
            id: 'item-mc-1',
            itemType: 'MULTIPLE_CHOICE',
            prompt: 'Berikut yang termasuk gerak lokomotor adalah...',
            order: 1,
            options: [
              { id: 'opt-a', label: 'A', text: 'Berlari', isCorrect: true },
              { id: 'opt-b', label: 'B', text: 'Mengayun tangan' },
            ],
          },
        ],
      },
    ],
    answerKeys: [],
  };

  const val2 = validateAssessmentPackage(pkgMcNoAk, defaultContext);
  if (val2.valid || !val2.errors.some((e) => e.includes('belum memiliki AssessmentAnswerKey canonical'))) {
    throw new Error(`Test 2 Failed: Expected failure for missing canonical answer key. Errors: ${val2.errors.join('; ')}`);
  }
  console.log('  PASSED: Rejected missing canonical answer key despite legacy isCorrect.');

  // TEST 3: MULTIPLE_CHOICE with empty optionIds -> FAIL
  console.log('Test 3: MULTIPLE_CHOICE with empty optionIds in AssessmentAnswerKey -> FAIL');
  const pkgMcEmptyOptionIds: AssessmentPackage = {
    ...pkgMcValid,
    answerKeys: [
      {
        id: 'ak-1',
        instrumentId: 'inst-w',
        instrumentItemId: 'item-mc-1',
        answerType: 'OPTION',
        optionIds: [],
      },
    ],
  };
  const val3 = validateAssessmentPackage(pkgMcEmptyOptionIds, defaultContext);
  if (val3.valid || !val3.errors.some((e) => e.includes('belum memiliki AssessmentAnswerKey canonical') || e.includes('optionIds'))) {
    throw new Error(`Test 3 Failed: Expected failure for empty optionIds. Errors: ${val3.errors.join('; ')}`);
  }
  console.log('  PASSED: Rejected empty optionIds in AssessmentAnswerKey.');

  // TEST 4: MULTIPLE_CHOICE with multiple optionIds -> FAIL
  console.log('Test 4: MULTIPLE_CHOICE with multiple optionIds in AssessmentAnswerKey -> FAIL');
  const pkgMcMultipleOptionIds: AssessmentPackage = {
    ...pkgMcValid,
    answerKeys: [
      {
        id: 'ak-1',
        instrumentId: 'inst-w',
        instrumentItemId: 'item-mc-1',
        answerType: 'OPTION',
        optionIds: ['opt-a', 'opt-b'],
      },
    ],
  };
  const val4 = validateAssessmentPackage(pkgMcMultipleOptionIds, defaultContext);
  if (val4.valid || !val4.errors.some((e) => e.includes('tepat 1 opsi'))) {
    throw new Error(`Test 4 Failed: Expected failure for multiple optionIds in MC. Errors: ${val4.errors.join('; ')}`);
  }
  console.log('  PASSED: Rejected multiple optionIds for single MULTIPLE_CHOICE item.');

  // TEST 5: MULTIPLE_CHOICE with dangling optionId -> FAIL
  console.log('Test 5: MULTIPLE_CHOICE with dangling optionId -> FAIL');
  const pkgMcDanglingOptionId: AssessmentPackage = {
    ...pkgMcValid,
    answerKeys: [
      {
        id: 'ak-1',
        instrumentId: 'inst-w',
        instrumentItemId: 'item-mc-1',
        answerType: 'OPTION',
        optionIds: ['opt-ghost'],
      },
    ],
  };
  const val5 = validateAssessmentPackage(pkgMcDanglingOptionId, defaultContext);
  if (val5.valid || !val5.errors.some((e) => e.includes('tidak ditemukan') || e.includes('tidak ada pada pilihan'))) {
    throw new Error(`Test 5 Failed: Expected failure for dangling optionId. Errors: ${val5.errors.join('; ')}`);
  }
  console.log('  PASSED: Rejected dangling optionId.');

  // TEST 6: MULTIPLE_CHOICE with dual source conflict -> FAIL (fail closed)
  console.log('Test 6: MULTIPLE_CHOICE with dual source conflict (legacy isCorrect != answerKey) -> FAIL');
  const pkgMcConflict: AssessmentPackage = {
    ...pkgMcValid,
    instruments: [
      {
        id: 'inst-w',
        type: 'WRITTEN_TEST',
        items: [
          {
            id: 'item-mc-1',
            itemType: 'MULTIPLE_CHOICE',
            prompt: 'Berikut yang termasuk gerak lokomotor adalah...',
            order: 1,
            options: [
              { id: 'opt-a', label: 'A', text: 'Berlari', isCorrect: false },
              { id: 'opt-b', label: 'B', text: 'Mengayun tangan', isCorrect: true },
            ],
          },
        ],
      },
    ],
    answerKeys: [
      {
        id: 'ak-1',
        instrumentId: 'inst-w',
        instrumentItemId: 'item-mc-1',
        answerType: 'OPTION',
        optionIds: ['opt-a'],
      },
    ],
  };
  const val6 = validateAssessmentPackage(pkgMcConflict, defaultContext);
  if (val6.valid || !val6.errors.some((e) => e.includes('Dual answer source conflict'))) {
    throw new Error(`Test 6 Failed: Expected dual answer source conflict error. Errors: ${val6.errors.join('; ')}`);
  }
  console.log('  PASSED: Fail-closed on dual answer source conflict.');

  // TEST 7: MULTIPLE_SELECT with valid canonical AssessmentAnswerKey -> PASS
  console.log('Test 7: MULTIPLE_SELECT with valid canonical AssessmentAnswerKey -> PASS');
  const pkgMsValid: AssessmentPackage = {
    id: 'pkg-ms',
    assessmentPlanId: 'plan-1',
    academicSettingId: 'setting-1',
    title: 'Paket Asesmen MS Valid',
    blueprintItems: [
      { id: 'bp-ms-1', objectiveRefId: 'tp-1', instrumentType: 'WRITTEN_TEST', instrumentItemIds: ['item-ms-1'], order: 1 },
    ],
    instruments: [
      {
        id: 'inst-w',
        type: 'WRITTEN_TEST',
        items: [
          {
            id: 'item-ms-1',
            itemType: 'MULTIPLE_SELECT',
            prompt: 'Pilih semua aktivitas yang termasuk gerak non-lokomotor!',
            order: 1,
            options: [
              { id: 'opt-1', label: 'A', text: 'Meliuk' },
              { id: 'opt-2', label: 'B', text: 'Melompat' },
              { id: 'opt-3', label: 'C', text: 'Mengayun' },
              { id: 'opt-4', label: 'D', text: 'Berlari' },
            ],
          },
        ],
      },
    ],
    answerKeys: [
      {
        id: 'ak-ms-1',
        instrumentId: 'inst-w',
        instrumentItemId: 'item-ms-1',
        answerType: 'MULTIPLE_OPTION',
        optionIds: ['opt-1', 'opt-3'],
      },
    ],
    scoringGuides: [],
    rubrics: [],
    workflowStatus: 'DRAFT',
    revision: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  const val7 = validateAssessmentPackage(pkgMsValid, defaultContext);
  if (!val7.valid) {
    throw new Error(`Test 7 Failed: Expected valid MULTIPLE_SELECT package. Errors: ${val7.errors.join('; ')}`);
  }
  console.log('  PASSED: Valid canonical answer key for MULTIPLE_SELECT accepted.');

  // TEST 8: MULTIPLE_SELECT with empty optionIds -> FAIL
  console.log('Test 8: MULTIPLE_SELECT with empty optionIds -> FAIL');
  const pkgMsEmptyOptionIds: AssessmentPackage = {
    ...pkgMsValid,
    answerKeys: [
      {
        id: 'ak-ms-1',
        instrumentId: 'inst-w',
        instrumentItemId: 'item-ms-1',
        answerType: 'MULTIPLE_OPTION',
        optionIds: [],
      },
    ],
  };
  const val8 = validateAssessmentPackage(pkgMsEmptyOptionIds, defaultContext);
  if (val8.valid || !val8.errors.some((e) => e.includes('belum memiliki AssessmentAnswerKey canonical') || e.includes('optionIds kosong'))) {
    throw new Error(`Test 8 Failed: Expected failure on empty optionIds for MULTIPLE_SELECT. Errors: ${val8.errors.join('; ')}`);
  }
  console.log('  PASSED: Rejected empty optionIds for MULTIPLE_SELECT.');

  // TEST 9: MULTIPLE_SELECT with dual source conflict -> FAIL
  console.log('Test 9: MULTIPLE_SELECT with dual source conflict -> FAIL');
  const pkgMsConflict: AssessmentPackage = {
    ...pkgMsValid,
    instruments: [
      {
        id: 'inst-w',
        type: 'WRITTEN_TEST',
        items: [
          {
            id: 'item-ms-1',
            itemType: 'MULTIPLE_SELECT',
            prompt: 'Pilih semua aktivitas yang termasuk gerak non-lokomotor!',
            order: 1,
            options: [
              { id: 'opt-1', label: 'A', text: 'Meliuk', isCorrect: true },
              { id: 'opt-2', label: 'B', text: 'Melompat', isCorrect: true },
              { id: 'opt-3', label: 'C', text: 'Mengayun', isCorrect: false },
            ],
          },
        ],
      },
    ],
    answerKeys: [
      {
        id: 'ak-ms-1',
        instrumentId: 'inst-w',
        instrumentItemId: 'item-ms-1',
        answerType: 'MULTIPLE_OPTION',
        optionIds: ['opt-1', 'opt-3'],
      },
    ],
  };
  const val9 = validateAssessmentPackage(pkgMsConflict, defaultContext);
  if (val9.valid || !val9.errors.some((e) => e.includes('Dual answer source conflict'))) {
    throw new Error(`Test 9 Failed: Expected dual source conflict error for MULTIPLE_SELECT. Errors: ${val9.errors.join('; ')}`);
  }
  console.log('  PASSED: Fail-closed on MULTIPLE_SELECT dual source conflict.');

  // TEST 10: Type mismatch: MULTIPLE_CHOICE item with MULTIPLE_OPTION key -> FAIL
  console.log('Test 10: Type mismatch: MULTIPLE_CHOICE item with MULTIPLE_OPTION key -> FAIL');
  const pkgTypeMismatch1: AssessmentPackage = {
    ...pkgMcValid,
    answerKeys: [
      {
        id: 'ak-1',
        instrumentId: 'inst-w',
        instrumentItemId: 'item-mc-1',
        answerType: 'MULTIPLE_OPTION',
        optionIds: ['opt-a'],
      },
    ],
  };
  const val10 = validateAssessmentPackage(pkgTypeMismatch1, defaultContext);
  if (val10.valid || !val10.errors.some((e) => e.includes('MULTIPLE_OPTION') || e.includes('belum memiliki AssessmentAnswerKey canonical'))) {
    throw new Error(`Test 10 Failed: Expected type mismatch rejection. Errors: ${val10.errors.join('; ')}`);
  }
  console.log('  PASSED: Rejected MULTIPLE_OPTION key for MULTIPLE_CHOICE item.');

  // TEST 11: Type mismatch: MULTIPLE_SELECT item with OPTION key -> FAIL
  console.log('Test 11: Type mismatch: MULTIPLE_SELECT item with OPTION key -> FAIL');
  const pkgTypeMismatch2: AssessmentPackage = {
    ...pkgMsValid,
    answerKeys: [
      {
        id: 'ak-ms-1',
        instrumentId: 'inst-w',
        instrumentItemId: 'item-ms-1',
        answerType: 'OPTION',
        optionIds: ['opt-1'],
      },
    ],
  };
  const val11 = validateAssessmentPackage(pkgTypeMismatch2, defaultContext);
  if (val11.valid || !val11.errors.some((e) => e.includes('OPTION') || e.includes('belum memiliki AssessmentAnswerKey canonical'))) {
    throw new Error(`Test 11 Failed: Expected type mismatch rejection. Errors: ${val11.errors.join('; ')}`);
  }
  console.log('  PASSED: Rejected OPTION key for MULTIPLE_SELECT item.');

  // TEST 12: Cross-instrument reference on AssessmentAnswerKey -> FAIL
  console.log('Test 12: Cross-instrument reference on AssessmentAnswerKey -> FAIL');
  const pkgCrossInst: AssessmentPackage = {
    ...pkgMcValid,
    instruments: [
      {
        id: 'inst-w1',
        type: 'WRITTEN_TEST',
        items: [
          {
            id: 'item-mc-1',
            itemType: 'MULTIPLE_CHOICE',
            prompt: 'Soal 1',
            order: 1,
            options: [{ id: 'opt-a', label: 'A', text: 'Opsi A' }],
          },
        ],
      },
      {
        id: 'inst-w2',
        type: 'WRITTEN_TEST',
        items: [],
      },
    ],
    answerKeys: [
      {
        id: 'ak-cross',
        instrumentId: 'inst-w2', // points to inst-w2 but item is in inst-w1
        instrumentItemId: 'item-mc-1',
        answerType: 'OPTION',
        optionIds: ['opt-a'],
      },
    ],
  };
  const val12 = validateAssessmentPackage(pkgCrossInst, defaultContext);
  if (val12.valid || !val12.errors.some((e) => e.includes('cross-instrument reference') || e.includes('milik instrumen lain'))) {
    throw new Error(`Test 12 Failed: Expected cross-instrument reference error. Errors: ${val12.errors.join('; ')}`);
  }
  console.log('  PASSED: Rejected cross-instrument reference in AssessmentAnswerKey.');

  // TEST 13: Dangling instrumentId on AssessmentAnswerKey -> FAIL
  console.log('Test 13: Dangling instrumentId on AssessmentAnswerKey -> FAIL');
  const pkgDanglingInst: AssessmentPackage = {
    ...pkgMcValid,
    answerKeys: [
      {
        id: 'ak-dangling-inst',
        instrumentId: 'inst-non-existent',
        instrumentItemId: 'item-mc-1',
        answerType: 'OPTION',
        optionIds: ['opt-a'],
      },
    ],
  };
  const val13 = validateAssessmentPackage(pkgDanglingInst, defaultContext);
  if (val13.valid || !val13.errors.some((e) => e.includes('dangling reference') || e.includes('tidak ditemukan'))) {
    throw new Error(`Test 13 Failed: Expected dangling instrumentId error. Errors: ${val13.errors.join('; ')}`);
  }
  console.log('  PASSED: Rejected dangling instrumentId in AssessmentAnswerKey.');

  // TEST 14: Dangling instrumentItemId on AssessmentAnswerKey -> FAIL
  console.log('Test 14: Dangling instrumentItemId on AssessmentAnswerKey -> FAIL');
  const pkgDanglingItem: AssessmentPackage = {
    ...pkgMcValid,
    answerKeys: [
      {
        id: 'ak-dangling-item',
        instrumentId: 'inst-w',
        instrumentItemId: 'item-ghost',
        answerType: 'OPTION',
        optionIds: ['opt-a'],
      },
    ],
  };
  const val14 = validateAssessmentPackage(pkgDanglingItem, defaultContext);
  if (val14.valid || !val14.errors.some((e) => e.includes('dangling reference') || e.includes('tidak ditemukan'))) {
    throw new Error(`Test 14 Failed: Expected dangling instrumentItemId error. Errors: ${val14.errors.join('; ')}`);
  }
  console.log('  PASSED: Rejected dangling instrumentItemId in AssessmentAnswerKey.');

  // TEST 15: MATCHING valid canonical SSOT -> PASS
  console.log('Test 15: MATCHING valid canonical SSOT -> PASS');
  const matchPremises: MatchingAssessmentEntry[] = [
    { id: 'p1', text: 'Sepak Bola' },
    { id: 'p2', text: 'Basket' },
  ];
  const matchResponses: MatchingAssessmentEntry[] = [
    { id: 'r1', text: 'Menendang' },
    { id: 'r2', text: 'Memantulkan (Dribble)' },
  ];
  const pkgMatchingValid: AssessmentPackage = {
    id: 'pkg-matching',
    assessmentPlanId: 'plan-1',
    academicSettingId: 'setting-1',
    title: 'Paket Asesmen Matching',
    blueprintItems: [
      { id: 'bp-m-1', objectiveRefId: 'tp-1', instrumentType: 'WRITTEN_TEST', instrumentItemIds: ['item-m-1'], order: 1 },
    ],
    instruments: [
      {
        id: 'inst-w',
        type: 'WRITTEN_TEST',
        items: [
          {
            id: 'item-m-1',
            itemType: 'MATCHING',
            prompt: 'Pasangkan cabang olahraga dengan teknik dasarnya!',
            order: 1,
            matchingPremises: matchPremises,
            matchingResponses: matchResponses,
          },
        ],
      },
    ],
    answerKeys: [
      {
        id: 'ak-m-1',
        instrumentId: 'inst-w',
        instrumentItemId: 'item-m-1',
        answerType: 'MATCHING',
        matchingPairs: [
          { premiseId: 'p1', responseId: 'r1' },
          { premiseId: 'p2', responseId: 'r2' },
        ],
      },
    ],
    scoringGuides: [],
    rubrics: [],
    workflowStatus: 'DRAFT',
    revision: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  const val15 = validateAssessmentPackage(pkgMatchingValid, defaultContext);
  if (!val15.valid) {
    throw new Error(`Test 15 Failed: Expected valid MATCHING package. Errors: ${val15.errors.join('; ')}`);
  }
  console.log('  PASSED: Valid MATCHING canonical answer key accepted.');

  // TEST 16: CATEGORY_RESPONSE valid canonical SSOT -> PASS
  console.log('Test 16: CATEGORY_RESPONSE valid canonical SSOT -> PASS');
  const catCategories: CategoryResponseCategory[] = [
    { id: 'cat-true', label: 'Benar' },
    { id: 'cat-false', label: 'Salah' },
  ];
  const catStatements: CategoryResponseStatement[] = [
    { id: 'stmt-1', text: 'Berlari adalah gerak lokomotor' },
    { id: 'stmt-2', text: 'Membungkuk adalah gerak manipulatif' },
  ];
  const pkgCategoryValid: AssessmentPackage = {
    id: 'pkg-cat',
    assessmentPlanId: 'plan-1',
    academicSettingId: 'setting-1',
    title: 'Paket Asesmen Kategori',
    blueprintItems: [
      { id: 'bp-c-1', objectiveRefId: 'tp-1', instrumentType: 'WRITTEN_TEST', instrumentItemIds: ['item-c-1'], order: 1 },
    ],
    instruments: [
      {
        id: 'inst-w',
        type: 'WRITTEN_TEST',
        items: [
          {
            id: 'item-c-1',
            itemType: 'CATEGORY_RESPONSE',
            prompt: 'Tentukan Benar/Salah untuk setiap pernyataan berikut!',
            order: 1,
            categoryResponseCategories: catCategories,
            categoryResponseStatements: catStatements,
          },
        ],
      },
    ],
    answerKeys: [
      {
        id: 'ak-c-1',
        instrumentId: 'inst-w',
        instrumentItemId: 'item-c-1',
        answerType: 'CATEGORY_RESPONSE',
        categoryAnswers: [
          { statementId: 'stmt-1', categoryId: 'cat-true' },
          { statementId: 'stmt-2', categoryId: 'cat-false' },
        ],
      },
    ],
    scoringGuides: [],
    rubrics: [],
    workflowStatus: 'DRAFT',
    revision: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  const val16 = validateAssessmentPackage(pkgCategoryValid, defaultContext);
  if (!val16.valid) {
    throw new Error(`Test 16 Failed: Expected valid CATEGORY_RESPONSE package. Errors: ${val16.errors.join('; ')}`);
  }
  console.log('  PASSED: Valid CATEGORY_RESPONSE canonical answer key accepted.');

  console.log('--- ALL 16 B.1.2n REGRESSION TESTS PASSED CLEANLY ---');
}

runB12nTests();
