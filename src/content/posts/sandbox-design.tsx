import { BlogPostData } from "./types";
import { Paragraph } from "../components";

export const sandboxDesign: BlogPostData = {
  title: "Building The Sandbox Design System",
  date: "February 10, 2024",
  slug: "sandbox-design",
  content: (
    <>
      <Paragraph delay={0.1}>
        Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aenean eu leo quam. Pellentesque ornare sem lacinia quam venenatis vestibulum.
      </Paragraph>
      <Paragraph delay={0.2}>
        Cum sociis natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus. Nullam quis risus eget urna mollis ornare vel eu leo.
      </Paragraph>
      <Paragraph delay={0.3}>
        Donec sed odio dui. Vestibulum id ligula porta felis euismod semper. Maecenas faucibus mollis interdum. Morbi leo risus, porta ac consectetur ac, vestibulum at eros.
      </Paragraph>
    </>
  ),
};
