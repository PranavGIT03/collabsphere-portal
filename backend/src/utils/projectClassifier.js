const typeRules = [
  { type: 'backend', basket: 'Systems & Infrastructure', keywords: ['api', 'server', 'backend', 'database', 'microservice'] },
  { type: 'coding', basket: 'Build & Ship', keywords: ['coding', 'javascript', 'python', 'react', 'app', 'software'] },
  { type: 'css', basket: 'Design & Experience', keywords: ['css', 'ui', 'ux', 'frontend', 'design', 'visual'] },
  { type: 'math', basket: 'Theory & Analytics', keywords: ['math', 'algebra', 'optimization', 'statistics', 'proof'] },
  { type: 'research', basket: 'Data & Research', keywords: ['research', 'paper', 'survey', 'study', 'analysis'] },
];

const flavorMap = {
  backend: 'If you like APIs, architecture, and making systems reliable, this project is for you.',
  coding: 'If you like coding, shipping features, and solving real problems, this project is for you.',
  css: 'If you like interface craft, design systems, and visual polish, this project is for you.',
  math: 'If you like analytical thinking, models, and hard problem-solving, this project is for you.',
  research: 'If you like asking good questions, exploring evidence, and synthesizing findings, this project is for you.',
  general: 'If you like learning fast and building something meaningful with a faculty mentor, this project is for you.',
};

const normalizeTerms = (value) =>
  String(value || '')
    .toLowerCase()
    .split(/[^a-z0-9+#.]+/)
    .map((item) => item.trim())
    .filter(Boolean);

const inferProjectMetadata = ({ title, summary, description, requiredSkills = [], tags = [] }) => {
  const combinedTerms = [
    ...normalizeTerms(title),
    ...normalizeTerms(summary),
    ...normalizeTerms(description),
    ...requiredSkills.flatMap(normalizeTerms),
    ...tags.flatMap(normalizeTerms),
  ];

  const match = typeRules
    .map((rule) => ({
      ...rule,
      score: rule.keywords.reduce((count, keyword) => count + (combinedTerms.includes(keyword) ? 1 : 0), 0),
    }))
    .sort((a, b) => b.score - a.score)[0];

  const projectType = match && match.score > 0 ? match.type : 'general';
  const basket = match && match.score > 0 ? match.basket : 'Interdisciplinary Explorer';

  return {
    projectType,
    basket,
    flavorText: flavorMap[projectType] || flavorMap.general,
  };
};

const scoreProjectForStudent = (project, user) => {
  if (!user || user.role === 'faculty') return 0;

  const projectTerms = new Set([
    ...normalizeTerms(project.projectType),
    ...normalizeTerms(project.basket),
    ...(project.requiredSkills || []).flatMap(normalizeTerms),
    ...(project.tags || []).flatMap(normalizeTerms),
    ...normalizeTerms(project.summary),
  ]);

  const learnerTerms = new Set([
    ...(user.skills || []).flatMap(normalizeTerms),
    ...(user.interests || []).flatMap(normalizeTerms),
    ...((user.courseBackground || []).flatMap((item) => normalizeTerms(item.course))),
  ]);

  let score = 0;
  learnerTerms.forEach((term) => {
    if (projectTerms.has(term)) {
      score += 1;
    }
  });

  return score;
};

module.exports = {
  inferProjectMetadata,
  scoreProjectForStudent,
};
