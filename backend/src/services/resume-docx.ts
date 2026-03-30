import {
  Document, Packer, Paragraph, TextRun, HeadingLevel,
  AlignmentType, BorderStyle, TabStopPosition, TabStopType,
  SectionType, convertInchesToTwip,
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

export async function generateDocx(data: ResumeData, templateId?: string): Promise<Buffer> {
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
