import { BlogPostData } from "./types";
import { Paragraph } from "../components";

export const trueBeliver: BlogPostData = {
  title: "The True Believer",
  author: "Eric Hoffer",
  date: "February 8, 2023",
  slug: "true-believer",
  content: (
    <>
      <Paragraph delay={0.1}>
        Lorem ipsum dolor sit amet, consectetur adipiscing elit. Maecenas sed diam eget risus varius blandit sit amet non magna. Cras justo odio, dapibus ac facilisis in, egestas eget quam.
      </Paragraph>
      <Paragraph delay={0.2}>
        Vestibulum id ligula porta felis euismod semper. Cum sociis natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus.
      </Paragraph>
      <Paragraph delay={0.3}>
        Donec id elit non mi porta gravida at eget metus. Nullam quis risus eget urna mollis ornare vel eu leo. Aenean eu leo quam. Pellentesque ornare sem lacinia quam venenatis vestibulum.
      </Paragraph>
    </>
  ),
};
