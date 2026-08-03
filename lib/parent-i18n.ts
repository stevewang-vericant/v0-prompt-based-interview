// UI language for the parent-facing interview flow. This is the *display*
// language of the interface (English or Chinese) and is independent of the
// parent's chosen response language (what they speak in their answers).

export type ParentUILang = "en" | "zh"

export const PARENT_UI_LANGUAGES: Array<{ code: ParentUILang; label: string }> = [
  { code: "en", label: "English" },
  { code: "zh", label: "中文" },
]

export const DEFAULT_PARENT_UI_LANG: ParentUILang = "en"

export function isParentUILang(value: string | null | undefined): value is ParentUILang {
  return value === "en" || value === "zh"
}

interface ParentStrings {
  // Page header (app/parent/interview/page.tsx)
  page: {
    title: string
    stageParentInfo: string
    stageSetup: string
    stageInterview: (n: number, total: number) => string
    stageComplete: string
    school: string
    uiLanguageLabel: string
    missingSchoolTitle: string
    missingSchoolBody: string
    unsupportedTitle: string
    unsupportedBody: string
    unableTitle: string
    loadingQuestions: string
    loadingInterview: string
  }
  // Parent info form (components/interview/interview-parent-info.tsx)
  info: {
    title: string
    descWithSchool: (school: string) => string
    descNoSchool: string
    requiredNote: string
    yourInfo: string
    fullName: string
    fullNamePh: string
    email: string
    emailPh: string
    relationship: string
    relationshipPh: string
    phone: string
    phonePh: string
    prefLang: string
    prefLangPh: string
    prefLangHint: string
    child: string
    childHint: string
    studentName: string
    studentNamePh: string
    studentEmail: string
    studentEmailPh: string
    studentEmailHint: string
    studentDob: string
    continue: string
    relationships: Record<string, string>
    errors: {
      nameRequired: string
      emailRequired: string
      emailInvalid: string
      relationshipRequired: string
      langRequired: string
      studentNameRequired: string
      studentEmailInvalid: string
      studentDobRequired: string
    }
  }
  // System check + instructions (components/interview/interview-setup.tsx)
  setup: {
    systemCheck: string
    systemCheckDesc: string
    camera: string
    cameraDesc: string
    microphone: string
    micDesc: string
    cameraPreview: string
    testDevices: string
    noticeTitle: string
    noticeBody: string
    consent: string
    startInterview: string
    consentHint: string
    instructions: string
    step1Title: string
    step1Body: (prep: number) => string
    step2Title: string
    step2Body: (resp: number) => string
    step3Title: string
    step3Body: (n: number) => string
    deviceError: string
  }
  // Recording screen (components/interview/interview-prompt.tsx)
  prompt: {
    questionOf: (n: number, total: number) => string
    readInstruction: string
    whatToExpect: string
    expectPrep: (prep: number) => string
    expectRec: (resp: number) => string
    recStartsNote: string
    startPrep: string
    prepPhase: string
    prepTip1: string
    prepTip2: string
    prepTip3: string
    prepTip4: (resp: number) => string
    recordingPrep: string
    recordingResponse: string
    prepRemaining: string
    doneNext: string
    done: string
    cameraError: string
  }
  // Completion (components/interview/interview-complete.tsx + complete page)
  complete: {
    heading: string
    recordedAll: (n: number) => string
    whatNext: string
    reviewTitle: string
    reviewBody: string
    deliveryTitle: string
    deliveryBody: string
    submitTitle: string
    submitDesc: string
    uploading: string
    doNotClose: string
    uploadDoneNote: string
    interviewId: string
    submitBtn: string
    uploadingBtn: string
    uploadDoneBtn: string
    confirm: string
    // Standalone complete page
    successTitle: string
    successBody: string
    errorTitle: string
    closeNote: string
    confirmationTo: (email: string) => string
    errorBody: string
  }
}

const en: ParentStrings = {
  page: {
    title: "Parent Video Interview",
    stageParentInfo: "Parent information",
    stageSetup: "System check and preparation",
    stageInterview: (n, total) => `Question ${n} of ${total}`,
    stageComplete: "Interview completed",
    school: "School",
    uiLanguageLabel: "Language",
    missingSchoolTitle: "Missing School Code",
    missingSchoolBody:
      "This interview link is missing a school code. Please use the link provided by the school.",
    unsupportedTitle: "Device Not Supported for Recording",
    unsupportedBody:
      "Video recording is only available on a PC or Mac. Please reopen this link on a desktop or laptop computer.",
    unableTitle: "Unable to Start Interview",
    loadingQuestions: "Loading interview questions...",
    loadingInterview: "Loading interview...",
  },
  info: {
    title: "Parent Interview",
    descWithSchool: (school) => `${school} invites you to complete a short video interview.`,
    descNoSchool: "Please complete a short video interview.",
    requiredNote: "Enter your information below. Fields marked with * are required.",
    yourInfo: "Your information",
    fullName: "Your Full Name",
    fullNamePh: "Your full name",
    email: "Your Email Address",
    emailPh: "your.email@example.com",
    relationship: "Relationship to Student",
    relationshipPh: "Select",
    phone: "Phone (Optional)",
    phonePh: "Phone number",
    prefLang: "Preferred Response Language",
    prefLangPh: "Select language",
    prefLangHint:
      "You can answer in this language. Each question is shown in English and in your language, and English subtitles are generated for the school.",
    child: "Your child (student)",
    childHint: "This helps the school link your interview to your child's interview, if one exists.",
    studentName: "Student Full Name",
    studentNamePh: "Your child's full name",
    studentEmail: "Student Email (Optional)",
    studentEmailPh: "student.email@example.com",
    studentEmailHint:
      "If your child has taken a Vericant interview or a Guided interview, please enter the student email used for that interview. This helps us link your interview to your child's.",
    studentDob: "Student Date of Birth",
    continue: "Continue to Interview",
    relationships: {
      Mother: "Mother",
      Father: "Father",
      Guardian: "Guardian",
      Grandparent: "Grandparent",
      Other: "Other",
    },
    errors: {
      nameRequired: "Please enter your full name",
      emailRequired: "Please enter your email address",
      emailInvalid: "Please enter a valid email address",
      relationshipRequired: "Please select your relationship to the student",
      langRequired: "Please select a preferred language",
      studentNameRequired: "Please enter your child's full name",
      studentEmailInvalid: "Please enter a valid student email address",
      studentDobRequired: "Please enter your child's date of birth",
    },
  },
  setup: {
    systemCheck: "System Check",
    systemCheckDesc:
      "Before starting your interview, we need to verify your camera and microphone are working properly",
    camera: "Camera",
    cameraDesc: "Required for video recording",
    microphone: "Microphone",
    micDesc: "Required for audio recording",
    cameraPreview: "Camera Preview",
    testDevices: "Test Camera & Microphone",
    noticeTitle: "Important: Both preparation and response will be recorded",
    noticeBody:
      "For each question your camera and microphone are recorded continuously from the start of the preparation timer until the end of your response. The school will receive a video of your responses, and they may also choose to view a separate video that includes your preparation time.",
    consent:
      "I understand that both my preparation time and my response will be recorded and may be shared with the school.",
    startInterview: "Start Interview",
    consentHint: "Please confirm the recording notice above",
    instructions: "Interview Instructions",
    step1Title: "Read the prompt and prepare",
    step1Body: (prep) =>
      `You'll have ${prep} seconds to prepare after reading each prompt. The camera and microphone are recording during preparation as well — the school may view this segment.`,
    step2Title: "Record your response",
    step2Body: (resp) => `You'll have ${resp} seconds to record your video response to each prompt`,
    step3Title: "Complete all questions",
    step3Body: (n) => `Answer ${n} question${n === 1 ? "" : "s"}`,
    deviceError:
      "Unable to access your camera or microphone. Please check your browser permissions and try again.",
  },
  prompt: {
    questionOf: (n, total) => `Question ${n} of ${total}`,
    readInstruction: 'Read the prompt carefully and click "Start Preparation" when ready',
    whatToExpect: "What to expect:",
    expectPrep: (prep) => `Preparation time: ${prep} seconds (recorded)`,
    expectRec: (resp) => `Recording time: ${resp} seconds`,
    recStartsNote:
      "Recording starts as soon as you click below. Both your preparation and your response are saved and shared with the school.",
    startPrep: "Start Preparation (recording begins)",
    prepPhase: "Preparation Phase (recording)",
    prepTip1: "Use this time to think about your response",
    prepTip2: "You are being recorded — the school will see this preparation segment",
    prepTip3: "Response phase will start automatically when prep time is up",
    prepTip4: (resp) => `You'll have ${resp} seconds to respond`,
    recordingPrep: "Recording (Preparation)",
    recordingResponse: "Recording (Response)",
    prepRemaining: "Preparation time remaining — response phase starts automatically",
    doneNext: "Done — Next Question",
    done: "Done",
    cameraError: "Unable to access camera and microphone. Please check your permissions.",
  },
  complete: {
    heading: "Interview Complete!",
    recordedAll: (n) => `You've successfully recorded all ${n} responses`,
    whatNext: "What Happens Next?",
    reviewTitle: "Review Process",
    reviewBody: "Your responses will be reviewed by the school.",
    deliveryTitle: "Video Delivery",
    deliveryBody:
      "Your video will be delivered to the school. You'll receive an email notification when complete.",
    submitTitle: "Submit Interview",
    submitDesc: "Click the button below to submit your interview video",
    uploading: "Uploading your interview video...",
    doNotClose: "Please wait, do not close this page",
    uploadDoneNote:
      "Upload complete! You can close this window. Video processing will continue in the background.",
    interviewId: "Interview ID:",
    submitBtn: "Submit Interview",
    uploadingBtn: "Uploading Video...",
    uploadDoneBtn: "Upload Complete!",
    confirm: "By submitting, you confirm that the information you provided is truthful.",
    successTitle: "Thank You!",
    successBody:
      "Your parent interview has been submitted successfully. The video is being processed and will be delivered to the school shortly.",
    errorTitle: "Something Went Wrong",
    closeNote: "You can now close this window.",
    confirmationTo: (email) => `A confirmation will be sent to ${email}.`,
    errorBody: "We were unable to submit your interview. Please try again or contact the school for help.",
  },
}

const zh: ParentStrings = {
  page: {
    title: "家长视频面试",
    stageParentInfo: "家长信息",
    stageSetup: "系统检测与准备",
    stageInterview: (n, total) => `第 ${n} 题 / 共 ${total} 题`,
    stageComplete: "面试已完成",
    school: "学校",
    uiLanguageLabel: "界面语言",
    missingSchoolTitle: "缺少学校代码",
    missingSchoolBody: "此面试链接缺少学校代码。请使用学校提供的链接。",
    unsupportedTitle: "该设备不支持录制",
    unsupportedBody: "视频录制仅支持 PC 或 Mac。请在台式机或笔记本电脑上重新打开此链接。",
    unableTitle: "无法开始面试",
    loadingQuestions: "正在加载面试题目……",
    loadingInterview: "正在加载面试……",
  },
  info: {
    title: "家长面试",
    descWithSchool: (school) => `${school} 邀请您完成一段简短的视频面试。`,
    descNoSchool: "请完成一段简短的视频面试。",
    requiredNote: "请填写以下信息。标有 * 的为必填项。",
    yourInfo: "您的信息",
    fullName: "您的姓名",
    fullNamePh: "您的姓名",
    email: "您的邮箱",
    emailPh: "your.email@example.com",
    relationship: "与学生的关系",
    relationshipPh: "请选择",
    phone: "电话（选填）",
    phonePh: "电话号码",
    prefLang: "首选回答语言",
    prefLangPh: "选择语言",
    prefLangHint:
      "您可以用该语言作答。每道题会以英文和您选择的语言显示，并会为学校生成英文字幕。",
    child: "您的孩子（学生）",
    childHint: "这有助于学校将您的面试与您孩子的面试进行关联（如已存在）。",
    studentName: "学生姓名",
    studentNamePh: "您孩子的姓名",
    studentEmail: "学生邮箱（选填）",
    studentEmailPh: "student.email@example.com",
    studentEmailHint:
      "如果您的孩子参加过 Vericant 面试或 Guided 面试，请填写当时使用的学生邮箱。这有助于我们将您的面试与孩子的面试进行关联。",
    studentDob: "学生出生日期",
    continue: "继续面试",
    relationships: {
      Mother: "母亲",
      Father: "父亲",
      Guardian: "监护人",
      Grandparent: "祖父母",
      Other: "其他",
    },
    errors: {
      nameRequired: "请输入您的姓名",
      emailRequired: "请输入您的邮箱",
      emailInvalid: "请输入有效的邮箱地址",
      relationshipRequired: "请选择您与学生的关系",
      langRequired: "请选择首选语言",
      studentNameRequired: "请输入您孩子的姓名",
      studentEmailInvalid: "请输入有效的学生邮箱地址",
      studentDobRequired: "请输入您孩子的出生日期",
    },
  },
  setup: {
    systemCheck: "系统检测",
    systemCheckDesc: "开始面试前，我们需要确认您的摄像头和麦克风工作正常",
    camera: "摄像头",
    cameraDesc: "视频录制所需",
    microphone: "麦克风",
    micDesc: "音频录制所需",
    cameraPreview: "摄像头预览",
    testDevices: "检测摄像头和麦克风",
    noticeTitle: "重要提示：准备时间和回答都会被录制",
    noticeBody:
      "每道题中，从准备计时开始到回答结束，您的摄像头和麦克风会连续录制。学校将收到您的回答视频，也可能查看包含准备时间的单独视频。",
    consent: "我理解我的准备时间和回答都会被录制，并可能分享给学校。",
    startInterview: "开始面试",
    consentHint: "请先确认上方的录制提示",
    instructions: "面试说明",
    step1Title: "阅读题目并准备",
    step1Body: (prep) =>
      `阅读每道题后，您有 ${prep} 秒准备时间。准备期间摄像头和麦克风也在录制 —— 学校可能会查看这段内容。`,
    step2Title: "录制您的回答",
    step2Body: (resp) => `每道题您有 ${resp} 秒时间录制视频回答。`,
    step3Title: "完成所有题目",
    step3Body: (n) => `共回答 ${n} 道题目`,
    deviceError: "无法访问您的摄像头或麦克风。请检查浏览器权限后重试。",
  },
  prompt: {
    questionOf: (n, total) => `第 ${n} 题 / 共 ${total} 题`,
    readInstruction: '请仔细阅读题目，准备好后点击"开始准备"。',
    whatToExpect: "接下来：",
    expectPrep: (prep) => `准备时间：${prep} 秒（录制中）`,
    expectRec: (resp) => `录制时间：${resp} 秒`,
    recStartsNote:
      "点击下方按钮后立即开始录制。您的准备和回答都会被保存并分享给学校。",
    startPrep: "开始准备（开始录制）",
    prepPhase: "准备阶段（录制中）",
    prepTip1: "利用这段时间思考您的回答",
    prepTip2: "您正在被录制 —— 学校会看到这段准备内容",
    prepTip3: "准备时间结束后将自动进入回答阶段",
    prepTip4: (resp) => `您将有 ${resp} 秒作答`,
    recordingPrep: "录制中（准备）",
    recordingResponse: "录制中（回答）",
    prepRemaining: "准备时间剩余 —— 回答阶段将自动开始",
    doneNext: "完成 —— 下一题",
    done: "完成",
    cameraError: "无法访问摄像头和麦克风。请检查您的权限设置。",
  },
  complete: {
    heading: "面试完成！",
    recordedAll: (n) => `您已成功录制全部 ${n} 段回答`,
    whatNext: "接下来会发生什么？",
    reviewTitle: "查看流程",
    reviewBody: "您的回答将由学校查看。",
    deliveryTitle: "视频送达",
    deliveryBody: "您的视频将送达学校。完成后您会收到邮件通知。",
    submitTitle: "提交面试",
    submitDesc: "点击下方按钮提交您的面试视频。",
    uploading: "正在上传您的面试视频……",
    doNotClose: "请稍候，不要关闭此页面",
    uploadDoneNote: "上传完成！您可以关闭此窗口。视频将在后台继续处理。",
    interviewId: "面试编号：",
    submitBtn: "提交面试",
    uploadingBtn: "正在上传视频……",
    uploadDoneBtn: "上传完成！",
    confirm: "提交即表示您确认所填写的信息真实无误。",
    successTitle: "感谢您！",
    successBody: "您的家长面试已成功提交。视频正在处理中，稍后将送达学校。",
    errorTitle: "提交出现问题",
    closeNote: "您现在可以关闭此窗口。",
    confirmationTo: (email) => `确认信息将发送至 ${email}。`,
    errorBody: "我们无法提交您的面试。请重试，或联系学校寻求帮助。",
  },
}

export function parentT(lang: ParentUILang): ParentStrings {
  return lang === "zh" ? zh : en
}
