import { BlogPostData } from "./types";
import {
  Paragraph,
  Heading,
  CodeBlock,
  InlineCode,
  BlogImage,
  Formula,
  List,
  ListItem,
} from "../components";

export const contrastiveLearning: BlogPostData = {
  title: "Contrastive Learning",
  date: "April 30, 2026",
  slug: "contrastive-learning",
  content: (
    <>
      <Paragraph delay={0.1}>
        If you've used image search on Google Photos, asked ChatGPT to describe a picture, or seen a model retrieve "a red bicycle parked on a city street" from a sea of unrelated photos, you've already seen contrastive learning at work. It's the trick behind models like CLIP, and it's quietly become one of the most useful ideas in modern ML.
      </Paragraph>

      <Paragraph delay={0.15}>
        The cool part is that the underlying idea is genuinely simple. No fancy losses. No complex architectures. Just a clean question: <em>can we teach a model that "this image" and "this caption" belong together, and everything else does not?</em> In this post I want to walk through how that works for image–text pairs, end to end.
      </Paragraph>

      <Heading level={2} delay={0.2}>
        The core idea
      </Heading>

      <Paragraph delay={0.25}>
        Contrastive learning has exactly two moves: <strong>pull matching pairs together</strong> in a shared embedding space, and <strong>push non-matching pairs apart</strong>. That's it. If you remember nothing else from this post, remember those two arrows.
      </Paragraph>

      <BlogImage
        delay={0.3}
        src="/blog/contrastive/core-idea.png"
        alt="Core idea of contrastive learning: pull matching pairs together, push non-matching pairs apart"
        caption="Figure 1: Two operations — pull and push — applied in a shared embedding space."
      />

      <Paragraph delay={0.35}>
        The reason this is powerful is that we don't need labels in the traditional sense. We don't need someone to tag every image with one of 1000 ImageNet classes. We just need <em>pairs that go together</em>, a photo and its caption, a question and its answer, a song and its lyrics. The web is full of those, which is why this approach scaled the way it did.
      </Paragraph>

      <Heading level={2} delay={0.4}>
        What does the data look like?
      </Heading>

      <Paragraph delay={0.45}>
        For image–text contrastive learning, the data is exactly what you'd hope: a bunch of (image, caption) pairs. To keep the running example concrete, here are four pairs we'll use throughout the post:
      </Paragraph>

      <BlogImage
        delay={0.5}
        src="/blog/contrastive/example-data.png"
        alt="Four image-text pairs: a dog, a mountain lake, a red car, and a cat"
        caption="Figure 2: A tiny batch of image–text pairs. Each image has exactly one caption that belongs to it; everything else is a non-match."
      />

      <Paragraph delay={0.55}>
        The clever bit: when we feed a batch of <Formula>{`N`}</Formula> pairs into the model, we get <Formula>{`N`}</Formula> matches and <Formula>{`N^2 - N`}</Formula> non-matches <em>for free</em>. With a batch of 4, that's 4 positives and 12 negatives. With a batch of 32,768 (which is what CLIP used), it's a lot more. Bigger batches → more negatives → more useful contrastive signal.
      </Paragraph>

      <Heading level={2} delay={0.6}>
        Two encoders, one shared space
      </Heading>

      <Paragraph delay={0.65}>
        Images and text are very different beasts. A 224×224 RGB image is a 150,528-dimensional integer tensor; a caption is a sequence of tokens. So we use two separate encoders — one for each modality — and have them both spit out a vector of the same size, say 512 dimensions.
      </Paragraph>

      <BlogImage
        delay={0.7}
        src="/blog/contrastive/encoders.png"
        alt="Image encoder (e.g., ViT or CNN) and text encoder (e.g., Transformer) project inputs into a shared embedding space"
        caption="Figure 3: Two encoders, two output streams, but vectors of the same shape."
      />

      <Paragraph delay={0.75}>
        Typical choices are a <InlineCode>ViT</InlineCode> or <InlineCode>ResNet</InlineCode> for the image side and a <InlineCode>Transformer</InlineCode> for the text side, but really anything that produces a fixed-length vector will do. The important thing is that the two output spaces have the same dimensionality, because we're about to compare them directly.
      </Paragraph>

      <Paragraph delay={0.8}>
        One detail that matters: we usually <strong>L2-normalize</strong> the embeddings before comparing them. That puts every vector on the unit hypersphere, which makes cosine similarity well-behaved and stops the model from cheating by just making vectors really long.
      </Paragraph>

      <Heading level={2} delay={0.85}>
        Computing similarity
      </Heading>

      <Paragraph delay={0.9}>
        Once both modalities live in the same space, comparing them is easy: take the dot product. If the vectors are L2-normalized, this is the cosine similarity, which lives in <Formula>{`[-1, 1]`}</Formula>. We do this for <em>every</em> image–text pair in the batch, which gives us an <Formula>{`N \\times N`}</Formula> similarity matrix.
      </Paragraph>

      <BlogImage
        delay={0.95}
        src="/blog/contrastive/similarity-matrix.png"
        alt="N x N similarity matrix between image and text embeddings, with high values on the diagonal"
        caption="Figure 4: The similarity matrix. The diagonal is what we want to push up; everything else is what we want to push down."
      />

      <Paragraph delay={1.0}>
        Look at the diagonal: <Formula>{`0.92`}</Formula>, <Formula>{`0.94`}</Formula>, <Formula>{`0.93`}</Formula>. Those are the matching pairs, the dog with the dog caption, the lake with the lake caption. The model has learned that a cat photo doesn't belong with a description of a mountain lake.
      </Paragraph>

      <Paragraph delay={1.05}>
        Reframed this way, the training problem becomes: <strong>make the diagonal of this matrix as bright as possible, and the off-diagonal as dark as possible</strong>. Which leads us nicely into the loss.
      </Paragraph>

      <Heading level={2} delay={1.1}>
        The contrastive objective
      </Heading>

      <Paragraph delay={1.15}>
        Here's the elegant move that makes everything click. Read each row of the similarity matrix as <em>the logits of a classifier</em>, where the correct class is the one on the diagonal. Suddenly we can use plain old cross-entropy.
      </Paragraph>

      <BlogImage
        delay={1.2}
        src="/blog/contrastive/contrastive-objective.png"
        alt="Positive pairs are pulled closer; negative pairs are pushed apart"
        caption="Figure 5: Positives in, negatives out. The loss is the bookkeeping that makes this happen."
      />

      <Paragraph delay={1.25}>
        For a single image <Formula>{`i`}</Formula>, the loss is:
      </Paragraph>

      <Formula block delay={1.3}>
        {`\\mathcal{L}_i = -\\log \\frac{\\exp\\bigl(\\operatorname{sim}(i, t_i) / \\tau\\bigr)}{\\sum_{j=1}^{N} \\exp\\bigl(\\operatorname{sim}(i, t_j) / \\tau\\bigr)}`}
      </Formula>

      <Paragraph delay={1.35}>
        The numerator rewards the model when image <Formula>{`i`}</Formula> is close to its own caption <Formula>{`t_i`}</Formula>. The denominator sums over all <Formula>{`N`}</Formula> captions in the batch and acts like a normalizer, for the loss to go down, the matching pair has to "win" the softmax against all the non-matching ones. That's the contrastive part.
      </Paragraph>

      <Paragraph delay={1.4}>
        The <Formula>{`\\tau`}</Formula> ("temperature") is a small positive number that controls how sharp the softmax is. Lower temperature = sharper = more aggressive about separating positives from hard negatives. CLIP makes <Formula>{`\\tau`}</Formula> a learnable parameter.
      </Paragraph>

      <Paragraph delay={1.45}>
        We compute this loss in both directions — image-to-text and text-to-image — and average them. That symmetry is what makes the embedding space coherent from both sides. In code, the whole thing is shockingly compact:
      </Paragraph>

      <CodeBlock
        delay={1.5}
        language="Python"
        code={`import torch
import torch.nn.functional as F

def contrastive_loss(image_embs, text_embs, temperature=0.07):
    # L2-normalize so dot product == cosine similarity
    image_embs = F.normalize(image_embs, dim=-1)
    text_embs  = F.normalize(text_embs,  dim=-1)

    # N x N similarity matrix, scaled by temperature
    logits = (image_embs @ text_embs.T) / temperature

    # The correct class for row i is column i — the diagonal
    labels = torch.arange(len(image_embs), device=logits.device)

    # Symmetric cross-entropy: image -> text and text -> image
    loss_i2t = F.cross_entropy(logits,    labels)
    loss_t2i = F.cross_entropy(logits.T,  labels)
    return (loss_i2t + loss_t2i) / 2`}
      />

      <Paragraph delay={1.55}>
        Six lines of real work. That's the whole CLIP loss.
      </Paragraph>

      <Heading level={2} delay={1.6}>
        What the embedding space looks like after training
      </Heading>

      <Paragraph delay={1.65}>
        After enough iterations of "pull, push, pull, push," something nice emerges: the embedding space organizes itself by <em>meaning</em>. Photos of dogs cluster near captions about dogs. Photos of mountains cluster near captions about mountains. And, this is the part that gets people excited, concepts that are semantically close end up close in space, even if you never explicitly told the model so.
      </Paragraph>

      <BlogImage
        delay={1.7}
        src="/blog/contrastive/embedding-space.png"
        alt="After training, related image-text pairs cluster together in embedding space"
        caption="Figure 6: The embedding space after training. Each cluster is a concept; nearness encodes meaning."
      />

      <Paragraph delay={1.75}>
        This is what makes <strong>zero-shot classification</strong> work. To classify an image as "cat" or "dog" with a trained model, you don't need to fine-tune anything. You just embed the image, embed the strings <InlineCode>"a photo of a cat"</InlineCode> and <InlineCode>"a photo of a dog"</InlineCode>, and pick whichever caption is closer. The model never saw your specific labels in training, but because it learned to align language with images in general, the comparison just works.
      </Paragraph>

      <Heading level={2} delay={1.8}>
        Putting it all together: the training loop
      </Heading>

      <Paragraph delay={1.85}>
        Here is the entire pipeline in one picture, top to bottom:
      </Paragraph>

      <BlogImage
        delay={1.9}
        size="lg"
        src="/blog/contrastive/training-loop.png"
        alt="The training loop: batch of pairs -> encoders -> similarity matrix -> contrastive loss -> backprop"
        caption="Figure 7: One training step. Repeat a few hundred million times and you get CLIP."
      />

      <Paragraph delay={1.95}>
        Each step:
      </Paragraph>

      <List ordered delay={2.0}>
        <ListItem>Sample a batch of <Formula>{`N`}</Formula> image–text pairs.</ListItem>
        <ListItem>Run images through the image encoder, captions through the text encoder.</ListItem>
        <ListItem>L2-normalize and form the <Formula>{`N \\times N`}</Formula> similarity matrix.</ListItem>
        <ListItem>Compute the symmetric contrastive loss against the diagonal.</ListItem>
        <ListItem>Backprop, update both encoders, repeat.</ListItem>
      </List>

      <Paragraph delay={2.05}>
        That's the whole algorithm. The hard parts are not in the loss, they're in scale, data quality, and tuning.
      </Paragraph>

      <Heading level={2} delay={2.1}>
        Takeaways
      </Heading>

      <List delay={2.15}>
        <ListItem>Contrastive learning aligns two modalities (or two views, or two anything) in a shared embedding space.</ListItem>
        <ListItem>The objective is just: matching pairs close, non-matching pairs far. Cross-entropy on the similarity matrix's diagonal makes that work.</ListItem>
        <ListItem>You get powerful zero-shot retrieval and classification almost for free, because the model learns <em>meaning</em>, not labels.</ListItem>
        <ListItem>The same recipe extends well beyond image–text — audio–text, video–text, code–doc, even single-modality self-supervision (SimCLR) all use this template.</ListItem>
      </List>

      <Paragraph delay={2.2}>
        Thanks for reading — and as always, feel free to reach out if you have questions or want to chat about this stuff.
      </Paragraph>
    </>
  ),
};
