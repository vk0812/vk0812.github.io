import { BlogPostData } from "./types";
import { Paragraph } from "../components";

export const erc721Factory: BlogPostData = {
  title: "ERC721 Factory",
  date: "February 3, 2024",
  slug: "erc721-factory",
  content: (
    <>
      <Paragraph delay={0.1}>
        Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vivamus lacinia odio vitae vestibulum vestibulum. Cras venenatis euismod malesuada.
      </Paragraph>
      <Paragraph delay={0.2}>
        Etiam porta sem malesuada magna mollis euismod. Nullam id dolor id nibh ultricies vehicula ut id elit. Donec id elit non mi porta gravida at eget metus.
      </Paragraph>
      <Paragraph delay={0.3}>
        Vestibulum id ligula porta felis euismod semper. Aenean lacinia bibendum nulla sed consectetur. Cras justo odio, dapibus ac facilisis in, egestas eget quam.
      </Paragraph>
    </>
  ),
};
