import {
  Document, Packer, Paragraph, TextRun,
  AlignmentType, BorderStyle, TabStopPosition, TabStopType,
  SectionType, convertInchesToTwip,
  Table, TableRow, TableCell, WidthType, ShadingType,
  ITableCellOptions,
} from 'docx';

// ═══ Types ═══

interface ResumeData {
  contact?: { name?: string; email?: string; phone?: string; location?: string; linkedin?: string; website?: string };
  summary?: string;
  experience?: Array<{
    role?: string; title?: string; company?: string; location?: string;
    start_date?: string; end_date?: string; dates?: string; current?: boolean;
    bullets?: string[];
  }>;
  education?: Array<{
    institution?: string; school?: string; degree?: string; field?: string;
    year?: string; dates?: string; gpa?: string;
  }>;
  skills?: any;
  achievements?: string[];
  personal?: { dob?: string; gender?: string; nationality?: string; father_name?: string; declaration_place?: string; declaration_date?: string };
}

// ═══ Theme tokens ═══

interface Theme {
  font: string;
  nameSize: number;
  nameColor: string;
  nameAlign: typeof AlignmentType[keyof typeof AlignmentType];
  headerColor: string;
  headerSize: number;
  headerBorder: boolean;
  bodySize: number;
  bodyColor: string;
  accentColor: string;
  // Sidebar themes
  sidebarBg?: string;
  sidebarText?: string;
  sidebarMuted?: string;
  sidebarWidth?: number; // percentage
  // Header band themes
  headerBandBg?: string;
  headerBandText?: string;
}

const THEMES: Record<string, Theme> = {
  // Single-column ATS
  classic:     { font: 'Arial', nameSize: 52, nameColor: '111827', nameAlign: AlignmentType.LEFT, headerColor: '374151', headerSize: 22, headerBorder: true, bodySize: 22, bodyColor: '374151', accentColor: '374151' },
  modern:      { font: 'Arial', nameSize: 56, nameColor: '0A66C2', nameAlign: AlignmentType.LEFT, headerColor: '0A66C2', headerSize: 24, headerBorder: false, bodySize: 22, bodyColor: '374151', accentColor: '0A66C2' },
  minimal:     { font: 'Georgia', nameSize: 44, nameColor: '111827', nameAlign: AlignmentType.CENTER, headerColor: '9CA3AF', headerSize: 20, headerBorder: true, bodySize: 22, bodyColor: '374151', accentColor: '9CA3AF' },
  compact:     { font: 'Arial', nameSize: 40, nameColor: '111827', nameAlign: AlignmentType.LEFT, headerColor: '374151', headerSize: 20, headerBorder: true, bodySize: 20, bodyColor: '374151', accentColor: '374151' },
  technical:   { font: 'Consolas', nameSize: 48, nameColor: '111827', nameAlign: AlignmentType.LEFT, headerColor: '0A66C2', headerSize: 22, headerBorder: false, bodySize: 22, bodyColor: '374151', accentColor: '0A66C2' },
  elegant:     { font: 'Georgia', nameSize: 48, nameColor: '111827', nameAlign: AlignmentType.LEFT, headerColor: '666666', headerSize: 22, headerBorder: true, bodySize: 22, bodyColor: '374151', accentColor: '666666' },
  executive:   { font: 'Georgia', nameSize: 60, nameColor: '111827', nameAlign: AlignmentType.CENTER, headerColor: '374151', headerSize: 26, headerBorder: true, bodySize: 24, bodyColor: '374151', accentColor: 'D4A574' },
  monochrome:  { font: 'Arial', nameSize: 60, nameColor: '000000', nameAlign: AlignmentType.LEFT, headerColor: '000000', headerSize: 24, headerBorder: true, bodySize: 22, bodyColor: '333333', accentColor: '000000' },
  serif:       { font: 'Georgia', nameSize: 52, nameColor: '1a1a1a', nameAlign: AlignmentType.LEFT, headerColor: '444444', headerSize: 22, headerBorder: true, bodySize: 22, bodyColor: '333333', accentColor: '444444' },
  headline:    { font: 'Arial', nameSize: 64, nameColor: '111827', nameAlign: AlignmentType.LEFT, headerColor: '374151', headerSize: 24, headerBorder: true, bodySize: 22, bodyColor: '374151', accentColor: '0A66C2' },
  divider:     { font: 'Arial', nameSize: 52, nameColor: '111827', nameAlign: AlignmentType.CENTER, headerColor: '555555', headerSize: 22, headerBorder: false, bodySize: 22, bodyColor: '374151', accentColor: 'D1D5DB' },
  // Accent header (single-column with colored top band)
  crimson:     { font: 'Arial', nameSize: 56, nameColor: 'FFFFFF', nameAlign: AlignmentType.LEFT, headerColor: '991B1B', headerSize: 24, headerBorder: true, bodySize: 22, bodyColor: '374151', accentColor: '991B1B', headerBandBg: '7F1D1D', headerBandText: 'FFFFFF' },
  ocean:       { font: 'Arial', nameSize: 56, nameColor: 'FFFFFF', nameAlign: AlignmentType.LEFT, headerColor: '0E7490', headerSize: 24, headerBorder: true, bodySize: 22, bodyColor: '374151', accentColor: '0E7490', headerBandBg: '155E75', headerBandText: 'FFFFFF' },
  slategold:   { font: 'Arial', nameSize: 56, nameColor: 'FFFFFF', nameAlign: AlignmentType.LEFT, headerColor: '334155', headerSize: 24, headerBorder: true, bodySize: 22, bodyColor: '475569', accentColor: 'B8860B', headerBandBg: '1E293B', headerBandText: 'FFFFFF' },
  indigo:      { font: 'Arial', nameSize: 56, nameColor: 'FFFFFF', nameAlign: AlignmentType.LEFT, headerColor: '4338CA', headerSize: 24, headerBorder: true, bodySize: 22, bodyColor: '374151', accentColor: '4338CA', headerBandBg: '312E81', headerBandText: 'FFFFFF' },
  // Two-column sidebar
  sidebar:     { font: 'Arial', nameSize: 52, nameColor: 'FFFFFF', nameAlign: AlignmentType.LEFT, headerColor: '1E293B', headerSize: 24, headerBorder: true, bodySize: 22, bodyColor: '374151', accentColor: '1E293B', sidebarBg: '1E293B', sidebarText: 'FFFFFF', sidebarMuted: 'B0B8C4', sidebarWidth: 30 },
  splitmodern: { font: 'Arial', nameSize: 52, nameColor: '0F172A', nameAlign: AlignmentType.LEFT, headerColor: '0F172A', headerSize: 22, headerBorder: true, bodySize: 22, bodyColor: '374151', accentColor: '0A66C2', sidebarBg: 'F1F5F9', sidebarText: '1E293B', sidebarMuted: '64748B', sidebarWidth: 35 },
  highlight:   { font: 'Arial', nameSize: 56, nameColor: 'FFFFFF', nameAlign: AlignmentType.LEFT, headerColor: '004182', headerSize: 24, headerBorder: true, bodySize: 22, bodyColor: '374151', accentColor: '004182', sidebarBg: 'F0F7FF', sidebarText: '004182', sidebarMuted: '4B7AB5', sidebarWidth: 35 },
  corporate:   { font: 'Arial', nameSize: 56, nameColor: 'FFFFFF', nameAlign: AlignmentType.LEFT, headerColor: '0F172A', headerSize: 24, headerBorder: true, bodySize: 22, bodyColor: '374151', accentColor: '004182', sidebarBg: 'F8FAFC', sidebarText: '0F172A', sidebarMuted: '64748B', sidebarWidth: 28 },
  fresher:     { font: 'Arial', nameSize: 52, nameColor: 'FFFFFF', nameAlign: AlignmentType.LEFT, headerColor: '1E1B4B', headerSize: 22, headerBorder: true, bodySize: 22, bodyColor: '374151', accentColor: '6366F1', sidebarBg: 'F5F3FF', sidebarText: '1E1B4B', sidebarMuted: '6B7280', sidebarWidth: 32 },
  // Special
  bold:        { font: 'Arial', nameSize: 72, nameColor: '111827', nameAlign: AlignmentType.LEFT, headerColor: '057642', headerSize: 28, headerBorder: true, bodySize: 24, bodyColor: '374151', accentColor: '057642' },
  salesbd:     { font: 'Arial', nameSize: 56, nameColor: 'FFFFFF', nameAlign: AlignmentType.LEFT, headerColor: 'E16B00', headerSize: 24, headerBorder: true, bodySize: 22, bodyColor: '374151', accentColor: 'E16B00', headerBandBg: '0F172A', headerBandText: 'FFFFFF' },
  campus:      { font: 'Arial', nameSize: 48, nameColor: '1e3a5f', nameAlign: AlignmentType.LEFT, headerColor: '1e3a5f', headerSize: 24, headerBorder: true, bodySize: 22, bodyColor: '333333', accentColor: '1e3a5f' },
  operator:    { font: 'Arial', nameSize: 56, nameColor: 'FFFFFF', nameAlign: AlignmentType.LEFT, headerColor: '0F172A', headerSize: 24, headerBorder: true, bodySize: 22, bodyColor: '334155', accentColor: '06B6D4', headerBandBg: '0F172A', headerBandText: 'FFFFFF' },
  editorial:   { font: 'Georgia', nameSize: 60, nameColor: '171717', nameAlign: AlignmentType.LEFT, headerColor: '9A3412', headerSize: 22, headerBorder: false, bodySize: 22, bodyColor: '292524', accentColor: 'C2410C' },
};

function getTheme(id?: string): Theme { return THEMES[id || 'classic'] || THEMES.classic; }

// ═══ No-border table ═══
const noBorders = {
  top: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
  bottom: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
  left: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
  right: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
  insideHorizontal: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
  insideVertical: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
};

// ═══ Shared helpers ═══

function sectionHdr(text: string, t: Theme): Paragraph {
  const prefix = t.font === 'Consolas' ? '// ' : '';
  return new Paragraph({
    children: [new TextRun({ text: prefix + text.toUpperCase(), bold: true, size: t.headerSize, font: t.font, color: t.headerColor })],
    spacing: { before: 300, after: 100 },
    border: t.headerBorder ? { bottom: { style: BorderStyle.SINGLE, size: 1, color: t.accentColor } } : undefined,
  });
}

function sideHdr(text: string, color: string, font: string): Paragraph {
  return new Paragraph({ children: [new TextRun({ text: text.toUpperCase(), bold: true, size: 18, font, color })], spacing: { before: 200, after: 80 } });
}

function buildExpParas(data: ResumeData, t: Theme): Paragraph[] {
  const p: Paragraph[] = [];
  for (const exp of (data.experience || [])) {
    const role = exp.role || exp.title || '';
    const company = exp.company || '';
    const dates = exp.dates || (exp.start_date ? `${exp.start_date} - ${exp.end_date || 'Present'}` : '');
    p.push(new Paragraph({
      children: [
        new TextRun({ text: `${role}${company ? ' — ' + company : ''}`, bold: true, size: 24, font: t.font, color: '111827' }),
        new TextRun({ text: '\t' }),
        new TextRun({ text: dates, italics: true, size: 20, font: t.font, color: '666666' }),
      ],
      tabStops: [{ type: TabStopType.RIGHT, position: TabStopPosition.MAX }],
      spacing: { before: 160, after: 40 },
    }));
    if (exp.location) p.push(new Paragraph({ children: [new TextRun({ text: exp.location, size: 20, font: t.font, color: '888888' })], spacing: { after: 60 } }));
    for (const b of (exp.bullets || [])) {
      p.push(new Paragraph({ children: [new TextRun({ text: b, size: t.bodySize, font: t.font, color: t.bodyColor })], bullet: { level: 0 }, spacing: { after: 40 } }));
    }
  }
  return p;
}

function buildEduParas(data: ResumeData, t: Theme): Paragraph[] {
  const p: Paragraph[] = [];
  for (const edu of (data.education || [])) {
    const deg = edu.degree || '';
    const school = edu.institution || edu.school || '';
    const details = [edu.field, edu.year || edu.dates].filter(Boolean).join(' • ');
    p.push(new Paragraph({ children: [new TextRun({ text: `${deg}${school ? ' — ' + school : ''}`, bold: true, size: 24, font: t.font, color: '111827' })], spacing: { before: 100, after: 40 } }));
    if (details) p.push(new Paragraph({ children: [new TextRun({ text: details, size: 22, font: t.font, color: '666666' })], spacing: { after: 40 } }));
    if (edu.gpa) p.push(new Paragraph({ children: [new TextRun({ text: `GPA: ${edu.gpa}`, size: 22, font: t.font, color: '666666' })], spacing: { after: 60 } }));
  }
  return p;
}

function buildSkillParas(data: ResumeData, t: Theme): Paragraph[] {
  const p: Paragraph[] = [];
  const skills = data.skills;
  if (!skills) return p;
  if (Array.isArray(skills)) {
    if (typeof skills[0] === 'string') {
      p.push(new Paragraph({ children: [new TextRun({ text: skills.join(', '), size: t.bodySize, font: t.font, color: t.bodyColor })], spacing: { after: 60 } }));
    } else {
      for (const cat of skills) {
        p.push(new Paragraph({
          children: [new TextRun({ text: `${cat.category || cat.label || ''}: `, bold: true, size: t.bodySize, font: t.font, color: t.bodyColor }), new TextRun({ text: (cat.skills || []).join(', '), size: t.bodySize, font: t.font, color: t.bodyColor })],
          spacing: { after: 60 },
        }));
      }
    }
  } else if (typeof skills === 'object') {
    for (const [label, items] of Object.entries(skills)) {
      if (Array.isArray(items) && items.length) {
        p.push(new Paragraph({
          children: [new TextRun({ text: `${label}: `, bold: true, size: t.bodySize, font: t.font, color: t.bodyColor }), new TextRun({ text: items.join(', '), size: t.bodySize, font: t.font, color: t.bodyColor })],
          spacing: { after: 60 },
        }));
      }
    }
  }
  return p;
}

function buildAchParas(data: ResumeData, t: Theme): Paragraph[] {
  return (data.achievements || []).map(a => new Paragraph({ children: [new TextRun({ text: a, size: t.bodySize, font: t.font, color: t.bodyColor })], bullet: { level: 0 }, spacing: { after: 40 } }));
}

function contactParas(c: ResumeData['contact'], font: string, color: string): Paragraph[] {
  return [c?.email, c?.phone, c?.location, c?.linkedin].filter(Boolean).map(p =>
    new Paragraph({ children: [new TextRun({ text: p || '', size: 18, font, color })], spacing: { after: 20 } })
  );
}

function buildDoc(children: (Paragraph | Table)[], margin = 0.75): Document {
  return new Document({
    sections: [{ properties: { type: SectionType.CONTINUOUS, page: { margin: { top: convertInchesToTwip(margin), bottom: convertInchesToTwip(margin), left: convertInchesToTwip(margin), right: convertInchesToTwip(margin) } } }, children }],
  });
}

// ═══ Builder: Single-column ATS (11 templates) ═══

async function buildSingleColumnDocx(data: ResumeData, t: Theme): Promise<Buffer> {
  const c = data.contact || {};
  const contactLine = [c.email, c.phone, c.location, c.linkedin, c.website].filter(Boolean).join('  |  ');
  const children: Paragraph[] = [];

  children.push(new Paragraph({ children: [new TextRun({ text: c.name || '', bold: true, size: t.nameSize, font: t.font, color: t.nameColor })], alignment: t.nameAlign, spacing: { after: 60 } }));
  if (contactLine) children.push(new Paragraph({ children: [new TextRun({ text: contactLine, size: 20, font: t.font, color: '555555' })], alignment: t.nameAlign, spacing: { after: 120 } }));
  children.push(new Paragraph({ children: [], border: { bottom: { style: BorderStyle.SINGLE, size: 1, color: t.accentColor } }, spacing: { after: 120 } }));
  if (data.summary) { children.push(sectionHdr('Professional Summary', t)); children.push(new Paragraph({ children: [new TextRun({ text: data.summary, size: t.bodySize, font: t.font, color: t.bodyColor })], spacing: { after: 100, line: 360 } })); }
  if (data.experience?.length) { children.push(sectionHdr('Work Experience', t)); children.push(...buildExpParas(data, t)); }
  if (data.education?.length) { children.push(sectionHdr('Education', t)); children.push(...buildEduParas(data, t)); }
  const sk = buildSkillParas(data, t); if (sk.length) { children.push(sectionHdr('Skills', t)); children.push(...sk); }
  const ach = buildAchParas(data, t); if (ach.length) { children.push(sectionHdr('Achievements', t)); children.push(...ach); }

  return Buffer.from(await Packer.toBuffer(buildDoc(children)));
}

// ═══ Builder: Accent header (4 templates: crimson, ocean, slategold, indigo) ═══

async function buildAccentHeaderDocx(data: ResumeData, t: Theme): Promise<Buffer> {
  const c = data.contact || {};
  const contactLine = [c.email, c.phone, c.location, c.linkedin].filter(Boolean).join('  |  ');
  const children: Paragraph[] = [];

  // Header band (shaded paragraphs)
  children.push(new Paragraph({ children: [new TextRun({ text: c.name || '', bold: true, size: t.nameSize, font: t.font, color: t.headerBandText || 'FFFFFF' })], shading: { type: ShadingType.SOLID, color: t.headerBandBg!, fill: t.headerBandBg! }, spacing: { after: 0 } }));
  if (contactLine) children.push(new Paragraph({ children: [new TextRun({ text: contactLine, size: 20, font: t.font, color: 'AAAAAA' })], shading: { type: ShadingType.SOLID, color: t.headerBandBg!, fill: t.headerBandBg! }, spacing: { after: 60 } }));
  // Accent line
  children.push(new Paragraph({ children: [], border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: t.accentColor } }, spacing: { after: 200 } }));

  if (data.summary) { children.push(sectionHdr('Professional Summary', t)); children.push(new Paragraph({ children: [new TextRun({ text: data.summary, size: t.bodySize, font: t.font, color: t.bodyColor })], spacing: { after: 100, line: 360 } })); }
  if (data.experience?.length) { children.push(sectionHdr('Experience', t)); children.push(...buildExpParas(data, t)); }
  if (data.education?.length) { children.push(sectionHdr('Education', t)); children.push(...buildEduParas(data, t)); }
  const sk = buildSkillParas(data, t); if (sk.length) { children.push(sectionHdr('Skills', t)); children.push(...sk); }
  const ach = buildAchParas(data, t); if (ach.length) { children.push(sectionHdr('Achievements', t)); children.push(...ach); }

  return Buffer.from(await Packer.toBuffer(buildDoc(children, 0.5)));
}

// ═══ Builder: Two-column sidebar (5 templates) ═══

async function buildSidebarDocx(data: ResumeData, t: Theme): Promise<Buffer> {
  const c = data.contact || {};
  const isDark = t.sidebarBg === '1E293B' || t.sidebarBg === '312E81';

  // Left: contact + skills + education
  const leftChildren: Paragraph[] = [];
  leftChildren.push(sideHdr('Contact', t.sidebarMuted || '999999', t.font));
  leftChildren.push(...contactParas(c, t.font, t.sidebarMuted || '999999'));
  leftChildren.push(sideHdr('Skills', t.sidebarMuted || '999999', t.font));
  leftChildren.push(...buildSkillParas(data, { ...t, bodySize: 20, bodyColor: isDark ? 'D1D5DB' : t.sidebarText || t.bodyColor }));
  leftChildren.push(sideHdr('Education', t.sidebarMuted || '999999', t.font));
  for (const edu of (data.education || [])) {
    const deg = edu.degree || ''; const school = edu.institution || edu.school || '';
    leftChildren.push(new Paragraph({ children: [new TextRun({ text: deg, bold: true, size: 20, font: t.font, color: t.sidebarText || '111827' })], spacing: { after: 20 } }));
    leftChildren.push(new Paragraph({ children: [new TextRun({ text: school, size: 18, font: t.font, color: t.sidebarMuted || '666666' })], spacing: { after: 20 } }));
    const details = [edu.year || edu.dates, edu.gpa ? `GPA: ${edu.gpa}` : ''].filter(Boolean).join(' — ');
    if (details) leftChildren.push(new Paragraph({ children: [new TextRun({ text: details, size: 16, font: t.font, color: t.sidebarMuted || '999999' })], spacing: { after: 40 } }));
  }

  // Right: name + summary + experience + achievements
  const rightChildren: Paragraph[] = [];
  rightChildren.push(new Paragraph({ children: [new TextRun({ text: c.name || '', bold: true, size: t.nameSize, font: t.font, color: isDark ? t.headerColor : t.nameColor })], spacing: { after: 100 } }));
  if (data.summary) {
    rightChildren.push(new Paragraph({ children: [new TextRun({ text: 'SUMMARY', bold: true, size: t.headerSize, font: t.font, color: t.headerColor })], border: { bottom: { style: BorderStyle.SINGLE, size: 2, color: t.accentColor } }, spacing: { before: 200, after: 80 } }));
    rightChildren.push(new Paragraph({ children: [new TextRun({ text: data.summary, size: t.bodySize, font: t.font, color: t.bodyColor })], spacing: { after: 100, line: 360 } }));
  }
  if (data.experience?.length) {
    rightChildren.push(new Paragraph({ children: [new TextRun({ text: 'EXPERIENCE', bold: true, size: t.headerSize, font: t.font, color: t.headerColor })], border: { bottom: { style: BorderStyle.SINGLE, size: 2, color: t.accentColor } }, spacing: { before: 200, after: 80 } }));
    rightChildren.push(...buildExpParas(data, t));
  }
  const ach = buildAchParas(data, t);
  if (ach.length) {
    rightChildren.push(new Paragraph({ children: [new TextRun({ text: 'ACHIEVEMENTS', bold: true, size: t.headerSize, font: t.font, color: t.headerColor })], border: { bottom: { style: BorderStyle.SINGLE, size: 2, color: t.accentColor } }, spacing: { before: 200, after: 80 } }));
    rightChildren.push(...ach);
  }

  const leftOpts: ITableCellOptions = { children: leftChildren, width: { size: t.sidebarWidth || 30, type: WidthType.PERCENTAGE }, shading: { type: ShadingType.SOLID, color: t.sidebarBg!, fill: t.sidebarBg! }, margins: { top: 200, bottom: 200, left: 200, right: 200 } };
  const rightOpts: ITableCellOptions = { children: rightChildren, width: { size: 100 - (t.sidebarWidth || 30), type: WidthType.PERCENTAGE }, margins: { top: 200, bottom: 200, left: 300, right: 200 } };

  const table = new Table({ rows: [new TableRow({ children: [new TableCell(leftOpts), new TableCell(rightOpts)] })], width: { size: 100, type: WidthType.PERCENTAGE }, borders: noBorders });
  const doc = new Document({ sections: [{ properties: { page: { margin: { top: convertInchesToTwip(0.5), bottom: convertInchesToTwip(0.5), left: convertInchesToTwip(0.4), right: convertInchesToTwip(0.4) } } }, children: [table] }] });
  return Buffer.from(await Packer.toBuffer(doc));
}

// ═══ Builder: Bold Statement ═══

async function buildBoldDocx(data: ResumeData): Promise<Buffer> {
  const t = getTheme('bold');
  const c = data.contact || {};
  const contactLine = [c.email, c.phone, c.location, c.linkedin].filter(Boolean).join('  |  ');
  const children: Paragraph[] = [];

  children.push(new Paragraph({ children: [new TextRun({ text: c.name || '', bold: true, size: t.nameSize, font: t.font, color: t.nameColor })], spacing: { after: 40 } }));
  children.push(new Paragraph({ children: [], border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: t.accentColor } }, spacing: { after: 80 } }));
  if (contactLine) children.push(new Paragraph({ children: [new TextRun({ text: contactLine, size: 22, font: t.font, color: '555555' })], spacing: { after: 160 } }));
  if (data.summary) { children.push(sectionHdr('Summary', t)); children.push(new Paragraph({ children: [new TextRun({ text: data.summary, size: 24, font: t.font, color: t.bodyColor })], spacing: { after: 100, line: 360 } })); }
  if (data.experience?.length) { children.push(sectionHdr('Experience', t)); children.push(...buildExpParas(data, t)); }
  if (data.education?.length) { children.push(sectionHdr('Education', t)); children.push(...buildEduParas(data, t)); }
  const sk = buildSkillParas(data, t); if (sk.length) { children.push(sectionHdr('Skills', t)); children.push(...sk); }
  const ach = buildAchParas(data, t); if (ach.length) { children.push(sectionHdr('Achievements', t)); children.push(...ach); }

  return Buffer.from(await Packer.toBuffer(buildDoc(children, 0.6)));
}

// ═══ Builder: Sales BD ═══

async function buildSalesBdDocx(data: ResumeData): Promise<Buffer> {
  const t = getTheme('salesbd');
  const c = data.contact || {};
  const contactLine = [c.email, c.phone, c.location, c.linkedin].filter(Boolean).join('  |  ');
  const children: Paragraph[] = [];

  children.push(new Paragraph({ children: [new TextRun({ text: c.name || '', bold: true, size: t.nameSize, font: t.font, color: 'FFFFFF' })], shading: { type: ShadingType.SOLID, color: '0F172A', fill: '0F172A' }, spacing: { after: 0 } }));
  if (contactLine) children.push(new Paragraph({ children: [new TextRun({ text: contactLine, size: 20, font: t.font, color: 'AAAAAA' })], shading: { type: ShadingType.SOLID, color: '0F172A', fill: '0F172A' }, spacing: { after: 60 } }));
  children.push(new Paragraph({ children: [], border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: 'E16B00' } }, spacing: { after: 200 } }));

  if (data.summary) { children.push(sectionHdr('Profile Summary', t)); children.push(new Paragraph({ children: [new TextRun({ text: data.summary, size: t.bodySize, font: t.font, color: t.bodyColor })], spacing: { after: 100, line: 360 } })); }
  if (data.experience?.length) { children.push(sectionHdr('Sales Experience', t)); children.push(...buildExpParas(data, t)); }
  if (data.education?.length) { children.push(sectionHdr('Education', t)); children.push(...buildEduParas(data, t)); }
  const sk = buildSkillParas(data, t); if (sk.length) { children.push(sectionHdr('Skills & Tools', t)); children.push(...sk); }
  const ach = buildAchParas(data, t); if (ach.length) { children.push(sectionHdr('Key Wins', t)); children.push(...ach); }

  return Buffer.from(await Packer.toBuffer(buildDoc(children, 0.5)));
}

// ═══ Builder: Campus Placement ═══

async function buildCampusDocx(data: ResumeData): Promise<Buffer> {
  const t = getTheme('campus');
  const c = data.contact || {};
  const p = data.personal || {};
  const contactLine = [c.email, c.phone, c.location, c.linkedin].filter(Boolean).join('  |  ');
  const children: Paragraph[] = [];

  children.push(new Paragraph({ children: [new TextRun({ text: c.name || '', bold: true, size: t.nameSize, font: t.font, color: t.nameColor })], spacing: { after: 40 } }));
  if (contactLine) children.push(new Paragraph({ children: [new TextRun({ text: contactLine, size: 20, font: t.font, color: '555555' })], spacing: { after: 40 } }));
  // Personal details
  const personalParts = [p.dob ? `DOB: ${p.dob}` : '', p.gender ? `Gender: ${p.gender}` : '', `Nationality: ${p.nationality || 'Indian'}`, p.father_name ? `Father's Name: ${p.father_name}` : ''].filter(Boolean);
  if (personalParts.length) children.push(new Paragraph({ children: [new TextRun({ text: personalParts.join('  |  '), size: 20, font: t.font, color: '777777' })], spacing: { after: 80 } }));
  children.push(new Paragraph({ children: [], border: { bottom: { style: BorderStyle.SINGLE, size: 2, color: t.accentColor } }, spacing: { after: 120 } }));

  if (data.summary) { children.push(sectionHdr('Career Objective', t)); children.push(new Paragraph({ children: [new TextRun({ text: data.summary, size: t.bodySize, font: t.font, color: t.bodyColor })], spacing: { after: 100, line: 360 } })); }
  // Education as table
  if (data.education?.length) {
    children.push(sectionHdr('Education', t));
    const headerRow = new TableRow({
      children: ['Degree', 'Institution', 'Year', 'GPA/%'].map(h =>
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: h, bold: true, size: 20, font: t.font, color: '374151' })], spacing: { after: 0 } })], shading: { type: ShadingType.SOLID, color: 'F0F4F8', fill: 'F0F4F8' }, width: { size: 25, type: WidthType.PERCENTAGE }, margins: { top: 40, bottom: 40, left: 80, right: 80 } })
      ),
    });
    const dataRows = data.education.map(edu => new TableRow({
      children: [edu.degree || '', edu.institution || edu.school || '', edu.year || edu.dates || '', edu.gpa || '—'].map(val =>
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: val, size: 20, font: t.font, color: '374151' })], spacing: { after: 0 } })], margins: { top: 40, bottom: 40, left: 80, right: 80 } })
      ),
    }));
    children.push(new Table({ rows: [headerRow, ...dataRows], width: { size: 100, type: WidthType.PERCENTAGE } }) as any);
    children.push(new Paragraph({ children: [], spacing: { after: 80 } }));
  }

  if (data.experience?.length) { children.push(sectionHdr('Experience / Internships', t)); children.push(...buildExpParas(data, t)); }
  const sk = buildSkillParas(data, t); if (sk.length) { children.push(sectionHdr('Technical & Soft Skills', t)); children.push(...sk); }
  const ach = buildAchParas(data, t); if (ach.length) { children.push(sectionHdr('Achievements & Activities', t)); children.push(...ach); }

  // Declaration
  children.push(new Paragraph({ children: [], border: { bottom: { style: BorderStyle.SINGLE, size: 1, color: 'DDDDDD' } }, spacing: { before: 200, after: 80 } }));
  children.push(new Paragraph({ children: [new TextRun({ text: 'DECLARATION', bold: true, size: 22, font: t.font, color: t.accentColor })], spacing: { after: 40 } }));
  children.push(new Paragraph({ children: [new TextRun({ text: 'I hereby declare that the information furnished above is true to the best of my knowledge and belief.', size: 20, font: t.font, color: '555555' })], spacing: { after: 80 } }));
  children.push(new Paragraph({
    children: [
      new TextRun({ text: `Place: ${p.declaration_place || '__________'}`, size: 20, font: t.font, color: '555555' }),
      new TextRun({ text: '\t' }),
      new TextRun({ text: c.name || '(Signature)', size: 20, font: t.font, color: t.accentColor, bold: true }),
    ],
    tabStops: [{ type: TabStopType.RIGHT, position: TabStopPosition.MAX }],
  }));
  children.push(new Paragraph({ children: [new TextRun({ text: `Date: ${p.declaration_date || '__________'}`, size: 20, font: t.font, color: '555555' })], spacing: { after: 40 } }));

  return Buffer.from(await Packer.toBuffer(buildDoc(children, 0.6)));
}

// ═══ Router ═══

// Template → builder mapping
const BUILDER_MAP: Record<string, (data: ResumeData) => Promise<Buffer>> = {
  // Single-column ATS (11)
  classic:     (d) => buildSingleColumnDocx(d, getTheme('classic')),
  modern:      (d) => buildSingleColumnDocx(d, getTheme('modern')),
  minimal:     (d) => buildSingleColumnDocx(d, getTheme('minimal')),
  compact:     (d) => buildSingleColumnDocx(d, getTheme('compact')),
  technical:   (d) => buildSingleColumnDocx(d, getTheme('technical')),
  elegant:     (d) => buildSingleColumnDocx(d, getTheme('elegant')),
  executive:   (d) => buildSingleColumnDocx(d, getTheme('executive')),
  monochrome:  (d) => buildSingleColumnDocx(d, getTheme('monochrome')),
  serif:       (d) => buildSingleColumnDocx(d, getTheme('serif')),
  headline:    (d) => buildSingleColumnDocx(d, getTheme('headline')),
  divider:     (d) => buildSingleColumnDocx(d, getTheme('divider')),
  // Accent header (4)
  crimson:     (d) => buildAccentHeaderDocx(d, getTheme('crimson')),
  ocean:       (d) => buildAccentHeaderDocx(d, getTheme('ocean')),
  slategold:   (d) => buildAccentHeaderDocx(d, getTheme('slategold')),
  indigo:      (d) => buildAccentHeaderDocx(d, getTheme('indigo')),
  // Sidebar (5)
  sidebar:     (d) => buildSidebarDocx(d, getTheme('sidebar')),
  splitmodern: (d) => buildSidebarDocx(d, getTheme('splitmodern')),
  highlight:   (d) => buildSidebarDocx(d, getTheme('highlight')),
  corporate:   (d) => buildSidebarDocx(d, getTheme('corporate')),
  fresher:     (d) => buildSidebarDocx(d, getTheme('fresher')),
  // Special (3)
  bold:        buildBoldDocx,
  salesbd:     buildSalesBdDocx,
  campus:      buildCampusDocx,
  operator:    (d) => buildAccentHeaderDocx(d, getTheme('operator')),
  editorial:   (d) => buildSingleColumnDocx(d, getTheme('editorial')),
};

export async function generateDocx(data: ResumeData, templateId?: string): Promise<Buffer> {
  const builder = BUILDER_MAP[templateId || 'classic'] || BUILDER_MAP.classic;
  return builder(data);
}
