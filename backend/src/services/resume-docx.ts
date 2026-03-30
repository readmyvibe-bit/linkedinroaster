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

function buildSectionHeader(text: string): Paragraph {
  return new Paragraph({
    children: [
      new TextRun({
        text: text.toUpperCase(),
        bold: true,
        size: 22, // 11pt
        font: 'Arial',
        color: '374151',
      }),
    ],
    spacing: { before: 300, after: 100 },
    border: {
      bottom: { style: BorderStyle.SINGLE, size: 1, color: 'E5E7EB' },
    },
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

export async function generateDocx(data: ResumeData): Promise<Buffer> {
  const c = data.contact || {};
  const contactLine = [c.email, c.phone, c.location, c.linkedin, c.website].filter(Boolean).join('  |  ');

  const children: Paragraph[] = [];

  // ── Name ──
  children.push(new Paragraph({
    children: [
      new TextRun({
        text: c.name || '',
        bold: true,
        size: 56, // 28pt
        font: 'Arial',
        color: '111827',
      }),
    ],
    alignment: AlignmentType.LEFT,
    spacing: { after: 60 },
  }));

  // ── Contact Line ──
  if (contactLine) {
    children.push(new Paragraph({
      children: [
        new TextRun({
          text: contactLine,
          size: 20, // 10pt
          font: 'Arial',
          color: '555555',
        }),
      ],
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
    children.push(buildSectionHeader('Professional Summary'));
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
    children.push(buildSectionHeader('Work Experience'));

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
    children.push(buildSectionHeader('Education'));

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
    children.push(buildSectionHeader('Skills'));

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
    children.push(buildSectionHeader('Achievements'));
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
