import { BlogPostData } from "./types";
import { 
  Paragraph, 
  Heading, 
} from "../components";

export const internExp: BlogPostData = {
  title: "Going into the Adobe Life",
  date: "January 3, 2026",
  slug: "intern-exp",
  content: (
    <>
      <Paragraph delay={0.1}>
        Hi everyone, I'm Vidit, and this summer, I had the incredible opportunity to intern at Adobe as a Product Intern (their term for a Software Intern). As a fourth year MEMS student deeply passionate about Computer Science, this experience provided invaluable insights into the world of software development at a leading tech company. In this blog, I'll walk you through my journey.
      </Paragraph>

      <Heading level={2} delay={0.15}>
        The Internship
      </Heading>

      <Paragraph delay={0.2}>
        Like most other companies, Adobe came through the placement cell at IITB during the internship season. It wasn't a Day 1 company, but the IAF opened sometime around Week 1. I heard about the internship through my seniors, and since I wanted to pursue a software internship, Adobe was a no-brainer for me.
      </Paragraph>

      <Paragraph delay={0.25}>
        Unfortunately, most Day 1 companies weren't open for my department, which was demotivating. I won't lie; I hoped to get at least a shortlist from companies like Uber and Goldman, but I received zero. I learned the hard way that skills are not the only things you need to get into a Day 1 company. I was a little disappointed, but that's life.
      </Paragraph>

      <Paragraph delay={0.3}>
        Adobe opened its IAF around the time the Day 1 results were announced. Since I wanted a software role, and Adobe's product intern description was a perfect fit, I immediately signed the IAF. Adobe stood out to me because they're a product-based company, and the internship involved working directly on unique products like Express, Photoshop, and Acrobat. Having used some of these tools and hearing about them since childhood, it was exciting to think about contributing to them.
      </Paragraph>

      <Heading level={2} delay={0.35}>
        The Shortlisting
      </Heading>

      <Paragraph delay={0.4}>
        Adobe's selection process started with a coding round that was open to everyone. There was a mix-up initially, as they didn't open for MEMS. Thankfully, the ICs convinced the company to open it for MEMS students with a CPI above 8. The coding round consisted of around 10 MCQs and two DSA questions. The MCQs were pretty straightforward and focused on CS basics like time complexity, algorithms, and linked lists. The two DSA questions were a medium-level array question and a slightly harder 2D DP question.
      </Paragraph>

      <Paragraph delay={0.45}>
        Solving about 8-9 MCQs and 1.5 DSA questions landed me on the waitlist. I was the first on the waitlist, meaning I got the chance if someone from the shortlisted candidates didn't appear for the interview or received an offer elsewhere. Luckily, someone who had received another company's offer the previous day couldn't attend the interview. After some time, I got the most relieving call from one of the ICs asking which interview slot I preferred. Since I wasn't prepared at all, I chose the last slot! This taught me that no matter how good and skilled you are, you need a certain amount of luck during the internship season!
      </Paragraph>

      <Heading level={2} delay={0.5}>
        The Interview
      </Heading>

      <Paragraph delay={0.55}>
        As soon as my interview was scheduled, I contacted a senior who received an offer from Adobe last year. He told me to relax, review my resume, be confident, and study a little about the company. I learned everything I could about Adobe and what it offers while reviewing my resume.
      </Paragraph>

      <Paragraph delay={0.6}>
        Unlike most companies interviewed in August, Adobe's interview was conducted online. I showed up ready, wearing a white shirt and (black shorts 😂). It began with a basic self-introduction. Then, the interviewer asked me questions about my projects and past internships, all from my resume, nothing unexpected. Finally, we moved to the DSA section, where he opened a random notepad for collaborative coding (with no autocomplete, of course!). He asked Tree questions, which, with his help, I managed to solve in a way he liked.
      </Paragraph>

      <Paragraph delay={0.65}>
        My interview officially ended, and we entered the "If you have any questions for me" section. My advice to everyone, regardless of your profile, is to ask the interviewer about their work and what makes their company different. Show them you are genuinely interested in their company, even if you've applied to 15 others😂. And with that, after almost an hour, my interview was over. There was no HR round, just a single technical round.
      </Paragraph>

      <Heading level={2} delay={0.7}>
        The #AdobeLife
      </Heading>

      <Paragraph delay={0.75}>
        I was assigned to Adobe's main office in Delhi (Noida) for 10 weeks. While Adobe's stipend is slightly lower than that of other companies, it provides an incredibly generous relocation bonus, which makes the overall compensation better than that of different software companies.
      </Paragraph>

      <Paragraph delay={0.8}>
        Adobe follows a great practice where every intern gets an independent project (almost like a startup idea) that, if successful, gets incorporated into one of their existing products. My project involved Text2Video, and my assigned product was Adobe Express (a competitor to Canva). Since I had complete ownership of the project, I had a lot of freedom to try different approaches and utilize Adobe's resources. I was assigned a mentor and a manager who guided me throughout the project, and I'm grateful for their support.
      </Paragraph>

      <Paragraph delay={0.85}>
        The work culture was very relaxed, with no fixed office hours. People came in after lunch or even in shorts – perks of being a software company, I guess! Transitioning to Delhi was relatively easy except for the weather. It was scorching hot; you had to think twice before stepping out. But overall, it was a great experience, and I enjoyed exploring Delhi. Noida doesn't have much to offer regarding sightseeing, so you must travel to Delhi frequently, but the metro system is excellent.
      </Paragraph>

      <Heading level={2} delay={0.9}>
        The Final Thoughts
      </Heading>

      <Paragraph delay={0.95}>
        This internship season was a rollercoaster, but it taught me the value of perseverance, the importance of being open to different opportunities, and the power of a bit of luck. Landing a Day 1 internship might seem like the ultimate goal, but many notable companies like Adobe await discovery. So keep your options open, be curious, ask questions, and most importantly, enjoy the ride! You never know what incredible adventures await. There will be times when you feel down and not up for it. But hang in there! If I could go back and tell myself one thing before starting the internship season, it would be to relax and expect the unexpected. The real magic of any experience lies in the surprises it throws your way.
      </Paragraph>

      <Paragraph delay={1.0}>
        Thank you so much for staying with me until the end of this long story. All the best! And feel free to contact me if you need any help!
      </Paragraph>
    </>
  ),
};

