import { BlogPostData } from "./types";
import { Paragraph } from "../components";

export const technopoly: BlogPostData = {
  title: "Technopoly",
  author: "Neil Postman",
  date: "November 11, 2024",
  slug: "technopoly",
  content: (
    <>
      <Paragraph delay={0.1}>
        Lorem ipsum dolor sit amet, consectetur adipiscing elit. Cras mattis consectetur purus sit amet fermentum. Etiam porta sem malesuada magna mollis euismod.
      </Paragraph>
      <Paragraph delay={0.2}>
        Aenean lacinia bibendum nulla sed consectetur. Praesent commodo cursus magna, vel scelerisque nisl consectetur et. Donec ullamcorper nulla non metus auctor fringilla.
      </Paragraph>
      <Paragraph delay={0.3}>
        Nullam id dolor id nibh ultricies vehicula ut id elit. Integer posuere erat a ante venenatis dapibus posuere velit aliquet.
      </Paragraph>
    </>
  ),
};
