import { BlogPostData } from "./types";
import { 
  Paragraph, 
  Heading, 
  CodeBlock, 
  InlineCode, 
  BlogImage, 
  Formula, 
  Diagram, 
  Quote, 
  List, 
  ListItem 
} from "../components";

export const exampleShowcase: BlogPostData = {
  title: "A Complete Guide to Modern Web Development",
  date: "January 3, 2026",
  slug: "example-showcase",
  content: (
    <>
      <Paragraph delay={0.1}>
        Lorem ipsum dolor sit amet, consectetur adipiscing elit. This comprehensive guide explores the fundamental concepts of modern web development, from basic principles to advanced techniques. Whether you're a seasoned developer or just starting your journey, this article will provide valuable insights into building robust, scalable applications.
      </Paragraph>

      <Paragraph delay={0.15}>
        In the rapidly evolving landscape of technology, staying current with best practices is essential. We'll examine everything from code architecture to mathematical foundations, visual design patterns, and philosophical approaches to problem-solving.
      </Paragraph>

      <Heading level={2} delay={0.2}>
        Understanding the Foundations
      </Heading>

      <Paragraph delay={0.25}>
        Before diving into complex implementations, it's crucial to understand the underlying principles that govern modern development. The relationship between structure and behavior forms the backbone of any well-designed system.
      </Paragraph>

      <Quote delay={0.3} author="Donald Knuth">
        Premature optimization is the root of all evil. Yet we should not pass up our opportunities in that critical 3%.
      </Quote>

      <Paragraph delay={0.35}>
        This wisdom from Knuth reminds us that while performance matters, clarity and correctness should come first. Let's explore how to implement a basic component structure using <InlineCode>TypeScript</InlineCode> and <InlineCode>React</InlineCode>.
      </Paragraph>

      <Heading level={3} delay={0.4}>
        Component Architecture
      </Heading>

      <Paragraph delay={0.45}>
        A well-structured component follows the single responsibility principle. Here's an example of a reusable button component:
      </Paragraph>

      <CodeBlock 
        delay={0.5}
        language="TypeScript"
        code={`interface ButtonProps {
  variant: 'primary' | 'secondary' | 'ghost';
  size: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
  onClick?: () => void;
}

export const Button = ({ 
  variant, 
  size, 
  children, 
  onClick 
}: ButtonProps) => {
  const baseStyles = "rounded-lg font-medium transition-all";
  
  const variants = {
    primary: "bg-primary text-primary-foreground",
    secondary: "bg-secondary text-secondary-foreground",
    ghost: "bg-transparent hover:bg-muted"
  };

  return (
    <button 
      className={\`\${baseStyles} \${variants[variant]}\`}
      onClick={onClick}
    >
      {children}
    </button>
  );
};`}
      />

      <Paragraph delay={0.55}>
        The above pattern demonstrates how to create flexible, type-safe components that can be easily extended and maintained over time.
      </Paragraph>

      <Heading level={2} delay={0.6}>
        Mathematical Foundations
      </Heading>

      <Paragraph delay={0.65}>
        Understanding the mathematics behind algorithms is essential for optimizing performance. Consider the time complexity of common operations—a sorting algorithm with <Formula>O(n log n)</Formula> complexity will significantly outperform one with <Formula>O(n²)</Formula> for large datasets.
      </Paragraph>

      <Heading level={3} delay={0.7}>
        The Fibonacci Sequence
      </Heading>

      <Paragraph delay={0.75}>
        One of the most elegant mathematical concepts in computer science is the Fibonacci sequence. The recursive definition is beautifully simple:
      </Paragraph>

      <Formula block delay={0.8}>
        F(n) = F(n-1) + F(n-2), where F(0) = 0 and F(1) = 1
      </Formula>

      <Paragraph delay={0.85}>
        The golden ratio, approximately <Formula>φ ≈ 1.618033988749</Formula>, emerges naturally from this sequence and appears throughout nature and design.
      </Paragraph>

      <Formula block delay={0.9}>
        φ = (1 + √5) / 2 = lim(n→∞) F(n+1) / F(n)
      </Formula>

      <Heading level={2} delay={0.95}>
        Visual Design Patterns
      </Heading>

      <Paragraph delay={1.0}>
        Modern web applications rely heavily on visual hierarchy and thoughtful design. The following diagram illustrates a typical component hierarchy in a React application:
      </Paragraph>

      <Diagram delay={1.05} caption="Figure 1: Component hierarchy in a typical React application">
        <div className="text-center font-mono text-sm">
          <div className="mb-4 p-3 bg-primary/10 rounded-lg inline-block">App</div>
          <div className="flex justify-center gap-8 mb-4">
            <div className="flex flex-col items-center">
              <div className="w-px h-4 bg-border"></div>
              <div className="p-2 bg-muted rounded">Header</div>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-px h-4 bg-border"></div>
              <div className="p-2 bg-muted rounded">Main</div>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-px h-4 bg-border"></div>
              <div className="p-2 bg-muted rounded">Footer</div>
            </div>
          </div>
          <div className="flex justify-center gap-4">
            <div className="p-2 bg-muted/50 rounded text-xs">Nav</div>
            <div className="p-2 bg-muted/50 rounded text-xs">Hero</div>
            <div className="p-2 bg-muted/50 rounded text-xs">Content</div>
            <div className="p-2 bg-muted/50 rounded text-xs">Links</div>
          </div>
        </div>
      </Diagram>

      <Paragraph delay={1.1}>
        Each component in this hierarchy has a specific responsibility, making the codebase easier to understand, test, and maintain.
      </Paragraph>

      <BlogImage 
        delay={1.15}
        src="https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&q=80"
        alt="Code on a computer screen"
        caption="Figure 2: Clean code is the foundation of maintainable software"
      />

      <Heading level={2} delay={1.2}>
        Best Practices
      </Heading>

      <Paragraph delay={1.25}>
        Following established best practices ensures code quality and team productivity. Here are the key principles every developer should follow:
      </Paragraph>

      <List delay={1.3}>
        <ListItem>Write self-documenting code with clear variable and function names</ListItem>
        <ListItem>Keep functions small and focused on a single task</ListItem>
        <ListItem>Use TypeScript for type safety and better developer experience</ListItem>
        <ListItem>Implement comprehensive error handling and logging</ListItem>
        <ListItem>Write tests before or alongside your implementation code</ListItem>
      </List>

      <Heading level={3} delay={1.35}>
        The Development Workflow
      </Heading>

      <Paragraph delay={1.4}>
        A structured workflow is essential for consistent delivery. Consider this recommended process:
      </Paragraph>

      <List ordered delay={1.45}>
        <ListItem>Define requirements and acceptance criteria</ListItem>
        <ListItem>Design the solution architecture</ListItem>
        <ListItem>Implement with test-driven development</ListItem>
        <ListItem>Review code with peers</ListItem>
        <ListItem>Deploy to staging and validate</ListItem>
        <ListItem>Release to production with monitoring</ListItem>
      </List>

      <Heading level={4} delay={1.5}>
        Code Review Guidelines
      </Heading>

      <Paragraph delay={1.55}>
        During code reviews, focus on these key areas: correctness, readability, performance, and security. Use tools like <InlineCode>ESLint</InlineCode> and <InlineCode>Prettier</InlineCode> to automate style enforcement.
      </Paragraph>

      <CodeBlock 
        delay={1.6}
        language="JavaScript"
        code={`// eslint.config.js
export default [
  {
    rules: {
      "no-unused-vars": "error",
      "prefer-const": "warn",
      "no-console": "warn"
    }
  }
];`}
      />

      <Heading level={2} delay={1.65}>
        Advanced Patterns
      </Heading>

      <Paragraph delay={1.7}>
        As applications grow in complexity, advanced patterns become necessary. The following demonstrates a custom hook pattern for managing async state:
      </Paragraph>

      <CodeBlock 
        delay={1.75}
        language="TypeScript"
        code={`import { useState, useCallback } from 'react';

interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
}

export function useAsync<T>(asyncFn: () => Promise<T>) {
  const [state, setState] = useState<AsyncState<T>>({
    data: null,
    loading: false,
    error: null
  });

  const execute = useCallback(async () => {
    setState({ data: null, loading: true, error: null });
    
    try {
      const data = await asyncFn();
      setState({ data, loading: false, error: null });
    } catch (error) {
      setState({ 
        data: null, 
        loading: false, 
        error: error as Error 
      });
    }
  }, [asyncFn]);

  return { ...state, execute };
}`}
      />

      <Quote delay={1.8} author="Martin Fowler">
        Any fool can write code that a computer can understand. Good programmers write code that humans can understand.
      </Quote>

      <Paragraph delay={1.85}>
        This principle should guide every architectural decision we make. The goal is not just working software, but software that can evolve with changing requirements.
      </Paragraph>

      <Heading level={2} delay={1.9}>
        Performance Optimization
      </Heading>

      <Paragraph delay={1.95}>
        Understanding performance metrics is crucial. The relationship between perceived performance and actual metrics can be expressed as:
      </Paragraph>

      <Formula block delay={2.0}>
        Perceived Performance = f(First Contentful Paint, Time to Interactive, Cumulative Layout Shift)
      </Formula>

      <Paragraph delay={2.05}>
        Each metric contributes differently to user experience. A fast FCP of under <Formula>1.8s</Formula> creates a sense of responsiveness, while a TTI under <Formula>3.8s</Formula> ensures the application feels interactive.
      </Paragraph>

      <BlogImage 
        delay={2.1}
        src="https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&q=80"
        alt="Analytics dashboard"
        caption="Figure 3: Monitoring performance metrics is essential for optimization"
      />

      <Heading level={3} delay={2.15}>
        Optimization Techniques
      </Heading>

      <Paragraph delay={2.2}>
        Several techniques can dramatically improve performance:
      </Paragraph>

      <List delay={2.25}>
        <ListItem>Code splitting with dynamic imports using <InlineCode>React.lazy()</InlineCode></ListItem>
        <ListItem>Image optimization with modern formats like WebP and AVIF</ListItem>
        <ListItem>Caching strategies with service workers</ListItem>
        <ListItem>Memoization with <InlineCode>useMemo</InlineCode> and <InlineCode>useCallback</InlineCode></ListItem>
      </List>

      <Heading level={2} delay={2.3}>
        Conclusion
      </Heading>

      <Paragraph delay={2.35}>
        Lorem ipsum dolor sit amet, consectetur adipiscing elit. Modern web development is a multifaceted discipline requiring expertise across many domains. From understanding mathematical foundations to implementing elegant visual designs, the journey of a developer is one of continuous learning.
      </Paragraph>

      <Paragraph delay={2.4}>
        The principles outlined in this guide—clean architecture, type safety, performance optimization, and maintainable code—form the foundation upon which great applications are built. As technology evolves, these fundamentals remain constant.
      </Paragraph>

      <Quote delay={2.45} author="Alan Kay">
        The best way to predict the future is to invent it.
      </Quote>

      <Paragraph delay={2.5}>
        Armed with these tools and techniques, you're well-equipped to build the next generation of web applications. Remember: the goal is not perfection, but continuous improvement. Start simple, iterate often, and always keep the user experience at the center of every decision.
      </Paragraph>
    </>
  ),
};
