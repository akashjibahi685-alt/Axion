const { PrismaClient } = require('@prisma/client');
const { faker } = require('@faker-js/faker');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('Starting seed process...');

  // 1. ClubBranding
  await prisma.clubBranding.upsert({
    where: { id: 'axion-branding' },
    update: {},
    create: {
      id: 'axion-branding',
      clubName: 'AXION',
      fullName: 'Artificial Intelligence and Robotics Society',
      tagline: 'Innovating the Future',
      description: 'The official AI and Robotics club of the university.',
      primaryColor: '#0ea5e9',
      secondaryColor: '#06b6d4',
      accentColor: '#f59e0b',
      githubUrl: 'https://github.com/axion',
      discordUrl: 'https://discord.gg/axion',
    }
  });

  // 2. Users
  const studentPasswordHash = await bcrypt.hash('member123', 10);
  
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@axion-aiml.club' },
    update: {},
    create: {
      email: 'admin@axion-aiml.club',
      name: 'Aarav (Admin)',
      passwordHash: await bcrypt.hash('admin', 10),
      role: 'Admin',
      isAdmin: true,
      title: 'President',
    }
  });

  const mentorUser = await prisma.user.upsert({
    where: { email: 'mentor@axion-aiml.club' },
    update: {},
    create: {
      email: 'mentor@axion-aiml.club',
      name: 'Elena (Mentor)',
      passwordHash: await bcrypt.hash('mentor', 10),
      role: 'Admin',
      isAdmin: true,
      title: 'Technical Mentor',
    }
  });

  const leadUser = await prisma.user.upsert({
    where: { email: 'lead@axion-aiml.club' },
    update: {},
    create: {
      email: 'lead@axion-aiml.club',
      name: 'Sophia (Lead)',
      passwordHash: await bcrypt.hash('lead', 10),
      role: 'Admin',
      isAdmin: true,
      title: 'Core Lead',
    }
  });

  const users = [];
  for (let i = 0; i < 10; i++) {
    const email = faker.internet.email();
    const user = await prisma.user.upsert({
      where: { email },
      update: {},
      create: {
        email,
        name: faker.person.fullName(),
        passwordHash: studentPasswordHash,
        role: 'Student',
        isAdmin: false,
        avatarUrl: faker.image.avatar(),
        title: faker.person.jobTitle(),
      }
    });
    users.push(user);
  }

  // 3. Members
  for (let user of users) {
    await prisma.member.create({
      data: {
        userId: user.id,
        name: user.name,
        email: user.email,
        role: faker.helpers.arrayElement(['Member', 'Core Team', 'Lead']),
        department: faker.helpers.arrayElement(['Computer Science', 'Robotics', 'Electronics']),
        githubUrl: `https://github.com/${user.name.replace(/\s+/g, '').toLowerCase()}`,
        avatarUrl: user.avatarUrl,
        skills: {
          create: [
            { skill: 'Python' },
            { skill: 'Machine Learning' },
          ]
        }
      }
    });
  }

  // 4. Events
  const events = [];
  for (let i = 0; i < 5; i++) {
    const event = await prisma.event.create({
      data: {
        title: faker.company.catchPhrase(),
        type: faker.helpers.arrayElement(['Workshop', 'Hackathon', 'Seminar']),
        eventDate: faker.date.future(),
        eventTime: '18:00',
        location: faker.location.streetAddress(),
        speaker: faker.person.fullName(),
        capacity: 100,
        status: faker.helpers.arrayElement(['Upcoming', 'Ongoing']),
        description: faker.lorem.paragraph(),
        createdById: adminUser.id,
        tags: {
          create: [
            { tag: 'AI' },
            { tag: 'Robotics' }
          ]
        }
      }
    });
    events.push(event);
  }

  // 5. Projects
  for (let i = 0; i < 5; i++) {
    await prisma.project.create({
      data: {
        name: faker.commerce.productName(),
        category: faker.helpers.arrayElement(['Web App', 'Machine Learning', 'Hardware']),
        status: faker.helpers.arrayElement(['Ongoing', 'Completed']),
        stars: faker.number.int({ min: 10, max: 200 }),
        githubUrl: 'https://github.com/axion/project',
        description: faker.lorem.paragraph(),
        createdById: adminUser.id,
      }
    });
  }

  // 6. Learning Domains & Resources
  const domain = await prisma.learningDomain.upsert({
    where: { slug: 'machine-learning' },
    update: {},
    create: {
      name: 'Machine Learning',
      slug: 'machine-learning',
      badgeColor: 'blue',
      level: 'Intermediate',
      description: 'Learn the basics of ML.'
    }
  });

  await prisma.learningResource.create({
    data: {
      domainId: domain.id,
      title: 'Intro to Neural Networks',
      type: 'Video',
      format: 'MP4',
      duration: '45 mins',
      description: 'Understanding basic NNs.',
      isFeatured: true,
    }
  });

  // 7. Blog Posts
  for (let i = 0; i < 5; i++) {
    await prisma.blogPost.create({
      data: {
        title: faker.lorem.sentence(),
        authorId: adminUser.id,
        authorName: adminUser.name,
        category: 'Tutorial',
        readTime: '5 min',
        status: 'Published',
        excerpt: faker.lorem.sentences(2),
        content: faker.lorem.paragraphs(4),
      }
    });
  }

  // 8. Cms Pages
  await prisma.cmsPage.upsert({
    where: { id: 'hero' },
    update: {},
    create: {
      id: 'hero',
      content: JSON.stringify({ title: 'Welcome to AXION', subtitle: 'Building the future.' }),
    }
  });

  // 9. Faqs
  await prisma.faq.create({
    data: {
      question: 'How do I join AXION?',
      answer: 'Click on the Join button on the home page.',
    }
  });

  // 10. Announcements
  await prisma.announcement.create({
    data: {
      title: 'Welcome to AXION portal',
      content: 'We are glad to have you here.',
      createdById: adminUser.id,
    }
  });

  console.log('Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
