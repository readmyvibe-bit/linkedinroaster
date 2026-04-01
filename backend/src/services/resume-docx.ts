import {
  Document, Packer, Paragraph, TextRun, HeadingLevel,
  AlignmentType, BorderStyle, TabStopPosition, TabStopType,
  SectionType, convertInchesToTwip,
  Table, TableRow, TableCell, WidthType, ShadingType, TableBorders,
  ITableCellOptions,
} from 'docx';

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
}

interface TemplateStyle {
  nameSize: number;
  nameColor: string;
  nameAlign: typeof AlignmentType[keyof typeof AlignmentType];
  headerColor: string;
  headerSize: number;
  headerBorder: boolean;
  bodySize: number;
  bodyColor: string;
  accentColor: string;
  font: string;
}

const TEMPLATE_STYLES: Record<string, TemplateStyle> = {
  classic: { nameSize: 52, nameColor: '111827', nameAlign: AlignmentType.LEFT, headerColor: '374151', headerSize: 22, headerBorder: true, bodySize: 22, bodyColor: '374151', accentColor: '374151', font: 'Arial' },
  modern: { nameSize: 56, nameColor: '0A66C2', nameAlign: AlignmentType.LEFT, headerColor: '0A66C2', headerSize: 24, headerBorder: false, bodySize: 22, bodyColor: '374151', accentColor: '0A66C2', font: 'Arial' },
  minimal: { nameSize: 44, nameColor: '111827', nameAlign: AlignmentType.CENTER, headerColor: '9CA3AF', headerSize: 20, headerBorder: true, bodySize: 22, bodyColor: '374151', accentColor: '9CA3AF', font: 'Georgia' },
  executive: { nameSize: 60, nameColor: '111827', nameAlign: AlignmentType.CENTER, headerColor: '374151', headerSize: 26, headerBorder: true, bodySize: 24, bodyColor: '374151', accentColor: 'D4A574', font: 'Georgia' },
  compact: { nameSize: 40, nameColor: '111827', nameAlign: AlignmentType.LEFT, headerColor: '374151', headerSize: 20, headerBorder: true, bodySize: 20, bodyColor: '374151', accentColor: '374151', font: 'Arial' },
  bold: { nameSize: 68, nameColor: '111827', nameAlign: AlignmentType.LEFT, headerColor: '057642', headerSize: 28, headerBorder: true, bodySize: 22, bodyColor: '374151', accentColor: '057642', font: 'Arial' },
  elegant: { nameSize: 48, nameColor: '111827', nameAlign: AlignmentType.LEFT, headerColor: '666666', headerSize: 22, headerBorder: true, bodySize: 22, bodyColor: '374151', accentColor: '666666', font: 'Georgia' },
  technical: { nameSize: 48, nameColor: '111827', nameAlign: AlignmentType.LEFT, headerColor: '0A66C2', headerSize: 22, headerBorder: false, bodySize: 22, bodyColor: '374151', accentColor: '0A66C2', font: 'Consolas' },
  sidebar: { nameSize: 52, nameColor: '1E293B', nameAlign: AlignmentType.LEFT, headerColor: '1E293B', headerSize: 24, headerBorder: true, bodySize: 22, bodyColor: '374151', accentColor: '1E293B', font: 'Arial' },
  splitmodern: { nameSize: 52, nameColor: '0F172A', nameAlign: AlignmentType.LEFT, headerColor: '0F172A', headerSize: 22, headerBorder: true, bodySize: 22, bodyColor: '374151', accentColor: '0A66C2', font: 'Arial' },
  highlight: { nameSize: 56, nameColor: '004182', nameAlign: AlignmentType.LEFT, headerColor: '004182', headerSize: 24, headerBorder: true, bodySize: 22, bodyColor: '374151', accentColor: '004182', font: 'Arial' },
  corporate: { nameSize: 56, nameColor: '0F172A', nameAlign: AlignmentType.LEFT, headerColor: '0F172A', headerSize: 24, headerBorder: true, bodySize: 22, bodyColor: '374151', accentColor: '004182', font: 'Arial' },
};

function getStyle(templateId?: string): TemplateStyle {
  return TEMPLATE_STYLES[templateId || 'classic'] || TEMPLATE_STYLES.classic;
}

function buildSectionHeader(text: string, style: TemplateStyle): Paragraph {
  const headerText = style === TEMPLATE_STYLES.technical ? `// ${text.toUpperCase()}` : text.toUpperCase();
  return new Paragraph({
    children: [
      new TextRun({
        text: headerText,
        bold: true,
        size: style.headerSize,
        font: style.font,
        color: style.headerColor,
      }),
    ],
    spacing: { before: 300, after: 100 },
    border: style.headerBorder ? {
      bottom: { style: BorderStyle.SINGLE, size: 1, color: style.accentColor },
    } : undefined,
  });
}

function buildBullet(text: string): Paragraph {
  return new Paragraph({
    children: [
      new TextRun({
        text,
        size: 22,
        font: 'Arial',
        color: '374151',
      }),
    ],
    bullet: { level: 0 },
    spacing: { after: 40 },
  });
}

// ── Templates that use styled DOCX layouts ──
const STYLED_DOCX_TEMPLATES: Record<string, (data: ResumeData) => Promise<Buffer>> = {
  sidebar: buildSidebarDocx,
  splitmodern: buildSidebarDocx,
  highlight: buildSidebarDocx,
  corporate: buildSidebarDocx,
  salesbd: buildSalesBdDocx,
  bold: buildBoldDocx,
  fresher: buildSidebarDocx,
};

// ── No-border table helper ──
const noBorders = {
  top: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
  bottom: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
  left: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
  right: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
  insideHorizontal: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
  insideVertical: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
};

// ── Section paragraphs helpers ──
function buildContactParagraphs(c: ResumeData['contact'], font: string, color: string): Paragraph[] {
  const parts = [c?.email, c?.phone, c?.location, c?.linkedin].filter(Boolean);
  return parts.map(p => new Paragraph({
    children: [new TextRun({ text: p || '', size: 18, font, color })],
    spacing: { after: 20 },
  }));
}

function buildSkillsParagraphs(skills: any, font: string): Paragraph[] {
  const paras: Paragraph[] = [];
  if (!skills) return paras;
  if (Array.isArray(skills)) {
    if (typeof skills[0] === 'string') {
      paras.push(new Paragraph({ children: [new TextRun({ text: skills.join(', '), size: 20, font, color: '374151' })], spacing: { after: 40 } }));
    } else {
      for (const cat of skills) {
        paras.push(new Paragraph({
          children: [
            new TextRun({ text: `${cat.category || cat.label || ''}: `, bold: true, size: 20, font, color: '374151' }),
            new TextRun({ text: (cat.skills || []).join(', '), size: 20, font, color: '374151' }),
          ],
          spacing: { after: 40 },
        }));
      }
    }
  } else if (typeof skills === 'object') {
    for (const [label, items] of Object.entries(skills)) {
      if (Array.isArray(items) && items.length) {
        paras.push(new Paragraph({
          children: [
            new TextRun({ text: `${label}: `, bold: true, size: 20, font, color: '374151' }),
            new TextRun({ text: items.join(', '), size: 20, font, color: '374151' }),
          ],
          spacing: { after: 40 },
        }));
      }
    }
  }
  return paras;
}

function buildExpParagraphs(data: ResumeData, font: string): Paragraph[] {
  const paras: Paragraph[] = [];
  for (const exp of (data.experience || [])) {
    const role = exp.role || exp.title || '';
    const company = exp.company || '';
    const dates = exp.dates || (exp.start_date ? `${exp.start_date} - ${exp.end_date || 'Present'}` : '');
    paras.push(new Paragraph({
      children: [
        new TextRun({ text: `${role}${company ? ' — ' + company : ''}`, bold: true, size: 24, font, color: '111827' }),
        new TextRun({ text: '\t' }),
        new TextRun({ text: dates, italics: true, size: 20, font, color: '666666' }),
      ],
      tabStops: [{ type: TabStopType.RIGHT, position: TabStopPosition.MAX }],
      spacing: { before: 140, after: 40 },
    }));
    for (const b of (exp.bullets || [])) {
      paras.push(new Paragraph({ children: [new TextRun({ text: b, size: 22, font, color: '374151' })], bullet: { level: 0 }, spacing: { after: 30 } }));
    }
  }
  return paras;
}

function buildEduParagraphs(data: ResumeData, font: string): Paragraph[] {
  const paras: Paragraph[] = [];
  for (const edu of (data.education || [])) {
    const deg = edu.degree || '';
    const school = edu.institution || edu.school || '';
    const details = [edu.field, edu.year || edu.dates].filter(Boolean).join(' • ');
    paras.push(new Paragraph({
      children: [new TextRun({ text: `${deg}${school ? ' — ' + school : ''}`, bold: true, size: 22, font, color: '111827' })],
      spacing: { before: 80, after: 20 },
    }));
    if (details) paras.push(new Paragraph({ children: [new TextRun({ text: details, size: 20, font, color: '666666' })], spacing: { after: 40 } }));
  }
  return paras;
}

function sideHdr(text: string, color: string, font: string): Paragraph {
  return new Paragraph({
    children: [new TextRun({ text: text.toUpperCase(), bold: true, size: 18, font, color })],
    spacing: { before: 200, after: 80 },
  });
}

function mainHdr(text: string, color: string, font: string): Paragraph {
  return new Paragraph({
    children: [new TextRun({ text: text.toUpperCase(), bold: true, size: 24, font, color })],
    spacing: { before: 260, after: 100 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 2, color } },
  });
}

// ═══ Sidebar DOCX (2-column table) ═══
async function buildSidebarDocx(data: ResumeData): Promise<Buffer> {
  const c = data.contact || {};
  const font = 'Arial';

  // Left column content: contact + skills + education
  const leftChildren: Paragraph[] = [];
  leftChildren.push(sideHdr('Contact', '1E293B', font));
  leftChildren.push(...buildContactParagraphs(c, font, '475569'));
  leftChildren.push(sideHdr('Skills', '1E293B', font));
  leftChildren.push(...buildSkillsParagraphs(data.skills, font));
  leftChildren.push(sideHdr('Education', '1E293B', font));
  leftChildren.push(...buildEduParagraphs(data, font));

  // Right column content: name + summary + experience + achievements
  const rightChildren: Paragraph[] = [];
  rightChildren.push(new Paragraph({
    children: [new TextRun({ text: c.name || '', bold: true, size: 52, font, color: '1E293B' })],
    spacing: { after: 100 },
  }));
  if (data.summary) {
    rightChildren.push(mainHdr('Summary', '1E293B', font));
    rightChildren.push(new Paragraph({ children: [new TextRun({ text: data.summary, size: 22, font, color: '374151' })], spacing: { after: 100, line: 360 } }));
  }
  if (data.experience?.length) {
    rightChildren.push(mainHdr('Experience', '1E293B', font));
    rightChildren.push(...buildExpParagraphs(data, font));
  }
  if (data.achievements?.length) {
    rightChildren.push(mainHdr('Achievements', '1E293B', font));
    for (const a of data.achievements) {
      rightChildren.push(new Paragraph({ children: [new TextRun({ text: a, size: 22, font, color: '374151' })], bullet: { level: 0 }, spacing: { after: 30 } }));
    }
  }

  const leftCellOpts: ITableCellOptions = {
    children: leftChildren,
    width: { size: 30, type: WidthType.PERCENTAGE },
    shading: { type: ShadingType.SOLID, color: 'F1F5F9', fill: 'F1F5F9' },
    margins: { top: 200, bottom: 200, left: 200, right: 200 },
  };
  const rightCellOpts: ITableCellOptions = {
    children: rightChildren,
    width: { size: 70, type: WidthType.PERCENTAGE },
    margins: { top: 200, bottom: 200, left: 300, right: 200 },
  };

  const table = new Table({
    rows: [new TableRow({ children: [new TableCell(leftCellOpts), new TableCell(rightCellOpts)] })],
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: noBorders,
  });

  const doc = new Document({
    sections: [{
      properties: { page: { margin: { top: convertInchesToTwip(0.5), bottom: convertInchesToTwip(0.5), left: convertInchesToTwip(0.4), right: convertInchesToTwip(0.4) } } },
      children: [table],
    }],
  });
  return Buffer.from(await Packer.toBuffer(doc));
}

// ═══ Sales BD DOCX (header band + orange accents) ═══
async function buildSalesBdDocx(data: ResumeData): Promise<Buffer> {
  const c = data.contact || {};
  const font = 'Arial';
  const contactLine = [c.email, c.phone, c.location, c.linkedin].filter(Boolean).join('  |  ');

  const children: Paragraph[] = [];

  // Dark header band (simulated with shading on paragraph)
  children.push(new Paragraph({
    children: [new TextRun({ text: c.name || '', bold: true, size: 56, font, color: 'FFFFFF' })],
    shading: { type: ShadingType.SOLID, color: '0F172A', fill: '0F172A' },
    spacing: { after: 0 },
  }));
  if (contactLine) {
    children.push(new Paragraph({
      children: [new TextRun({ text: contactLine, size: 20, font, color: 'AAAAAA' })],
      shading: { type: ShadingType.SOLID, color: '0F172A', fill: '0F172A' },
      spacing: { after: 60 },
    }));
  }
  // Orange accent line
  children.push(new Paragraph({
    children: [],
    border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: 'E16B00' } },
    spacing: { after: 200 },
  }));

  // Summary
  if (data.summary) {
    children.push(mainHdr('Profile Summary', 'E16B00', font));
    children.push(new Paragraph({ children: [new TextRun({ text: data.summary, size: 22, font, color: '374151' })], spacing: { after: 100, line: 360 } }));
  }
  // Experience
  if (data.experience?.length) {
    children.push(mainHdr('Sales Experience', 'E16B00', font));
    children.push(...buildExpParagraphs(data, font));
  }
  // Education
  if (data.education?.length) {
    children.push(mainHdr('Education', 'E16B00', font));
    children.push(...buildEduParagraphs(data, font));
  }
  // Skills
  if (data.skills) {
    children.push(mainHdr('Skills & Tools', 'E16B00', font));
    children.push(...buildSkillsParagraphs(data.skills, font));
  }
  // Achievements
  if (data.achievements?.length) {
    children.push(mainHdr('Key Wins', 'E16B00', font));
    for (const a of data.achievements) {
      children.push(new Paragraph({ children: [new TextRun({ text: '★ ' + a, size: 22, font, color: '374151' })], spacing: { after: 40 } }));
    }
  }

  const doc = new Document({
    sections: [{
      properties: { page: { margin: { top: convertInchesToTwip(0.5), bottom: convertInchesToTwip(0.5), left: convertInchesToTwip(0.6), right: convertInchesToTwip(0.6) } } },
      children,
    }],
  });
  return Buffer.from(await Packer.toBuffer(doc));
}

// ═══ Bold DOCX (large name + green accents) ═══
async function buildBoldDocx(data: ResumeData): Promise<Buffer> {
  const style = getStyle('bold');
  const c = data.contact || {};
  const contactLine = [c.email, c.phone, c.location, c.linkedin].filter(Boolean).join('  |  ');

  const children: Paragraph[] = [];
  children.push(new Paragraph({
    children: [new TextRun({ text: c.name || '', bold: true, size: 72, font: style.font, color: '111827' })],
    spacing: { after: 40 },
  }));
  // Green bar
  children.push(new Paragraph({ children: [], border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: '057642' } }, spacing: { after: 80 } }));
  if (contactLine) {
    children.push(new Paragraph({ children: [new TextRun({ text: contactLine, size: 22, font: style.font, color: '555555' })], spacing: { after: 160 } }));
  }
  if (data.summary) {
    children.push(mainHdr('Summary', '057642', style.font));
    children.push(new Paragraph({ children: [new TextRun({ text: data.summary, size: 24, font: style.font, color: '374151' })], spacing: { after: 100, line: 360 } }));
  }
  if (data.experience?.length) {
    children.push(mainHdr('Experience', '057642', style.font));
    children.push(...buildExpParagraphs(data, style.font));
  }
  if (data.education?.length) {
    children.push(mainHdr('Education', '057642', style.font));
    children.push(...buildEduParagraphs(data, style.font));
  }
  if (data.skills) {
    children.push(mainHdr('Skills', '057642', style.font));
    children.push(...buildSkillsParagraphs(data.skills, style.font));
  }
  if (data.achievements?.length) {
    children.push(mainHdr('Achievements', '057642', style.font));
    for (const a of data.achievements) {
      children.push(new Paragraph({ children: [new TextRun({ text: a, size: 22, font: style.font, color: '374151' })], bullet: { level: 0 }, spacing: { after: 30 } }));
    }
  }

  const doc = new Document({
    sections: [{
      properties: { page: { margin: { top: convertInchesToTwip(0.6), bottom: convertInchesToTwip(0.6), left: convertInchesToTwip(0.7), right: convertInchesToTwip(0.7) } } },
      children,
    }],
  });
  return Buffer.from(await Packer.toBuffer(doc));
}

export async function generateDocx(data: ResumeData, templateId?: string): Promise<Buffer> {
  // Check for styled DOCX builder
  const styledBuilder = STYLED_DOCX_TEMPLATES[templateId || ''];
  if (styledBuilder) return styledBuilder(data);

  // Default ATS-clean fallback
  const style = getStyle(templateId);
  const c = data.contact || {};
  const contactLine = [c.email, c.phone, c.location, c.linkedin, c.website].filter(Boolean).join('  |  ');

  const children: Paragraph[] = [];

  // ── Name ──
  children.push(new Paragraph({
    children: [
      new TextRun({
        text: c.name || '',
        bold: true,
        size: style.nameSize,
        font: style.font,
        color: style.nameColor,
      }),
    ],
    alignment: style.nameAlign,
    spacing: { after: 60 },
  }));

  // ── Contact Line ──
  if (contactLine) {
    children.push(new Paragraph({
      children: [
        new TextRun({
          text: contactLine,
          size: 20,
          font: style.font,
          color: '555555',
        }),
      ],
      alignment: style.nameAlign,
      spacing: { after: 120 },
    }));
  }

  // ── Divider ──
  children.push(new Paragraph({
    children: [],
    border: { bottom: { style: BorderStyle.SINGLE, size: 1, color: 'D1D5DB' } },
    spacing: { after: 120 },
  }));

  // ── Professional Summary ──
  if (data.summary) {
    children.push(buildSectionHeader('Professional Summary', style));
    children.push(new Paragraph({
      children: [
        new TextRun({
          text: data.summary,
          size: 22,
          font: 'Arial',
          color: '374151',
        }),
      ],
      spacing: { after: 100, line: 360 }, // 1.5 line spacing
    }));
  }

  // ── Work Experience ──
  if (data.experience?.length) {
    children.push(buildSectionHeader('Work Experience', style));

    for (const exp of data.experience) {
      const role = exp.role || exp.title || '';
      const company = exp.company || '';
      const dates = exp.dates || (exp.start_date ? `${exp.start_date} - ${exp.end_date || 'Present'}` : '');

      // Role — Company    Dates (right-aligned using tab stop)
      children.push(new Paragraph({
        children: [
          new TextRun({
            text: `${role}${company ? ' — ' + company : ''}`,
            bold: true,
            size: 24, // 12pt
            font: 'Arial',
            color: '111827',
          }),
          new TextRun({
            text: '\t',
          }),
          new TextRun({
            text: dates,
            italics: true,
            size: 22,
            font: 'Arial',
            color: '666666',
          }),
        ],
        tabStops: [{
          type: TabStopType.RIGHT,
          position: TabStopPosition.MAX,
        }],
        spacing: { before: 160, after: 40 },
      }));

      if (exp.location) {
        children.push(new Paragraph({
          children: [
            new TextRun({
              text: exp.location,
              size: 20,
              font: 'Arial',
              color: '888888',
            }),
          ],
          spacing: { after: 60 },
        }));
      }

      if (exp.bullets?.length) {
        for (const bullet of exp.bullets) {
          children.push(buildBullet(bullet));
        }
      }
    }
  }

  // ── Education ──
  if (data.education?.length) {
    children.push(buildSectionHeader('Education', style));

    for (const edu of data.education) {
      const degree = edu.degree || '';
      const institution = edu.institution || edu.school || '';
      const details = [edu.field, edu.year || edu.dates].filter(Boolean).join(' • ');

      children.push(new Paragraph({
        children: [
          new TextRun({
            text: `${degree}${institution ? ' — ' + institution : ''}`,
            bold: true,
            size: 24,
            font: 'Arial',
            color: '111827',
          }),
        ],
        spacing: { before: 100, after: 40 },
      }));

      if (details) {
        children.push(new Paragraph({
          children: [
            new TextRun({
              text: details,
              size: 22,
              font: 'Arial',
              color: '666666',
            }),
          ],
          spacing: { after: 80 },
        }));
      }

      if (edu.gpa) {
        children.push(new Paragraph({
          children: [
            new TextRun({ text: `GPA: ${edu.gpa}`, size: 22, font: 'Arial', color: '666666' }),
          ],
          spacing: { after: 60 },
        }));
      }
    }
  }

  // ── Skills ──
  const skills = data.skills;
  if (skills) {
    children.push(buildSectionHeader('Skills', style));

    if (Array.isArray(skills)) {
      if (typeof skills[0] === 'string') {
        children.push(new Paragraph({
          children: [new TextRun({ text: skills.join(', '), size: 22, font: 'Arial', color: '374151' })],
          spacing: { after: 80 },
        }));
      } else {
        for (const cat of skills) {
          children.push(new Paragraph({
            children: [
              new TextRun({ text: `${cat.category || cat.label || ''}: `, bold: true, size: 22, font: 'Arial', color: '374151' }),
              new TextRun({ text: (cat.skills || []).join(', '), size: 22, font: 'Arial', color: '374151' }),
            ],
            spacing: { after: 60 },
          }));
        }
      }
    } else if (typeof skills === 'object') {
      // skills: { technical: [], soft: [], languages: [], certifications: [] }
      const categories = [
        { label: 'Technical Skills', items: skills.technical },
        { label: 'Soft Skills', items: skills.soft },
        { label: 'Languages', items: skills.languages },
        { label: 'Certifications', items: skills.certifications },
      ];
      for (const cat of categories) {
        if (cat.items?.length) {
          children.push(new Paragraph({
            children: [
              new TextRun({ text: `${cat.label}: `, bold: true, size: 22, font: 'Arial', color: '374151' }),
              new TextRun({ text: cat.items.join(', '), size: 22, font: 'Arial', color: '374151' }),
            ],
            spacing: { after: 60 },
          }));
        }
      }
    }
  }

  // ── Achievements ──
  if (data.achievements?.length) {
    children.push(buildSectionHeader('Achievements', style));
    for (const a of data.achievements) {
      children.push(buildBullet(a));
    }
  }

  // No footer watermark — clean professional output

  // ── Build Document ──
  const doc = new Document({
    sections: [{
      properties: {
        type: SectionType.CONTINUOUS,
        page: {
          margin: {
            top: convertInchesToTwip(0.75),
            bottom: convertInchesToTwip(0.75),
            left: convertInchesToTwip(0.75),
            right: convertInchesToTwip(0.75),
          },
        },
      },
      children,
    }],
  });

  return Buffer.from(await Packer.toBuffer(doc));
}
