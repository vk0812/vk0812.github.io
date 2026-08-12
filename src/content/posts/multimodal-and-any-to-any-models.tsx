import { BlogPostData } from "./types";
import {
  Paragraph,
  Heading,
  List,
  ListItem,
  IconArchitectureDiagram,
  DiagramNode,
  DiagramEdge,
  ReplicationDiagram,
  ReplicationPanel,
} from "../components";
import { PatchTokenFlowDiagram } from "../components/animations/multimodal-and-any-to-any-models/ConceptViz";
import { Image, Type, Cpu, Layers, MessageSquare } from "lucide-react";

const flowNodes: DiagramNode[] = [
  { id: "image-in", label: "Photo", icon: Image, color: "text-slate-500", x: 20, y: 10 },
  { id: "text-in", label: "Question or caption", icon: Type, color: "text-slate-500", x: 80, y: 10 },
  { id: "image-enc", label: "Image encoder", sub: "patches or codebook tokens", icon: Cpu, color: "text-blue-500", x: 20, y: 38 },
  { id: "text-enc", label: "Text tokenizer", sub: "word or subword tokens", icon: Cpu, color: "text-indigo-500", x: 80, y: 38 },
  { id: "backbone", label: "Shared or cross-attending backbone", sub: "fuses both token streams", icon: Layers, color: "text-emerald-500", x: 50, y: 68 },
  { id: "output", label: "Answer", icon: MessageSquare, color: "text-emerald-600", x: 50, y: 92 },
];

const flowEdges: DiagramEdge[] = [
  { id: "e-image-in-enc", from: "image-in", to: "image-enc" },
  { id: "e-text-in-enc", from: "text-in", to: "text-enc" },
  { id: "e-image-enc-backbone", from: "image-enc", to: "backbone" },
  { id: "e-text-enc-backbone", from: "text-enc", to: "backbone" },
  { id: "e-backbone-output", from: "backbone", to: "output" },
];

const fusionPanels: [ReplicationPanel, ReplicationPanel] = [
  {
    title: "Early / unified fusion",
    writeLabel: "Image tokens and text tokens",
    fanLabel: "concatenated into one sequence",
    nodes: ["One shared transformer"],
    note: "Any image token and any text token can interact from the first layer, but every layer pays for every token of every modality.",
  },
  {
    title: "Cross-attention fusion",
    writeLabel: "Text tokens",
    fanLabel: "cross-attend into",
    nodes: ["Vision encoder features"],
    note: "The vision encoder runs once and stays separate from the text stack, cheaper, but image information only enters at the layers with a cross-attention step.",
  },
];

export const multimodalAndAnyToAnyModels: BlogPostData = {
  title: "Multimodal and any-to-any models",
  date: "August 12, 2026",
  slug: "multimodal-and-any-to-any-models",
  content: (
    <>
      <Paragraph delay={0.10}>
        Ask a model like GPT-4V or Gemini to look at a photo and describe it, and it just works. There's no separate "image module" bolted onto a chat window with custom glue code holding the two together. One model actually looks at the pixels and writes the sentence. That's the whole promise of a multimodal model, instead of training one network for text and a completely different network for images and stitching the two together by hand, one model learns to handle several kinds of input at once. Push that idea further and a model can also produce several kinds of output, text, images, maybe audio, from whatever mix of inputs it was given. That's what people mean by an <strong>any-to-any</strong> model, any modality in, any modality out, all handled by one network.
      </Paragraph>

      <Paragraph delay={0.15}>
        Carry one example through this. A phone camera takes a photo of a dog standing on a beach, and somebody writes the caption "a dog on a beach" underneath it. A multimodal model has to make sense of the pixels and the words together, in the same network. Getting there starts with the most basic question of all, how does a picture even become something a transformer can read.
      </Paragraph>

      <Heading level={2} delay={0.20}>
        Turning a picture into tokens
      </Heading>

      <Paragraph delay={0.25}>
        A transformer only knows how to read a sequence of vectors, one vector per position. A sentence is naturally a sequence already, one token per word or word-piece. A photo is not naturally a sequence, it's a grid of pixels. The first job of any vision-language model is to force that grid into the same shape a transformer already expects.
      </Paragraph>

      <Paragraph delay={0.30}>
        The most common way to do this is called <strong>patchification</strong>, and it's the same trick a Vision Transformer uses. Cut the image into a grid of small, fixed-size squares, called patches. Flatten each patch's pixels into one long vector. Pass that vector through one learned linear layer, projecting it down into the same size embedding the model uses everywhere else. The result is one embedding per patch, and a grid of patches read in order becomes a sequence of patch embeddings, no different in shape from a sequence of word embeddings.
      </Paragraph>

      <Paragraph delay={0.35}>
        Make that concrete with the beach photo. Resize it down to a small 96 by 96 pixel image and cut it into a 3 by 3 grid, nine patches, each 32 by 32 pixels. Flattening one patch's raw pixels gives a vector of 32 times 32 times 3 color channels, 3072 numbers. Projecting that through the linear layer might bring it down to 768 numbers, the same width the model's text embeddings already use. Nine patches, read left to right and top to bottom, become nine token-shaped vectors, ready to sit right next to the caption's word tokens.
      </Paragraph>

      <Paragraph delay={0.40}>
        Patch embeddings are continuous vectors, not the discrete symbols a word token already is. A second family of visual tokenizers closes that gap on purpose. A <strong>VQ-VAE</strong>, short for vector-quantized variational autoencoder, and its better known successor VQGAN, learn a fixed codebook of a few thousand vectors ahead of time. Every patch of an encoded image gets snapped to whichever codebook entry sits closest to it, and the whole image turns into a sequence of codebook indices, plain integers, exactly the data type a word token already is. A model built this way can run image tokens and text tokens through the exact same embedding table and the exact same softmax over one shared vocabulary, because at the input and output layers there's no longer any difference between the two.
      </Paragraph>

      <PatchTokenFlowDiagram
        delay={0.08}
        caption="The beach photo's 3x3 grid of patches flattens into token-shaped vectors and lands in the same shared sequence as the caption's word tokens."
      />

      <Heading level={2} delay={0.45}>
        Getting the two token streams to actually talk to each other
      </Heading>

      <Paragraph delay={0.50}>
        Having image tokens and text tokens sitting in the same shape doesn't automatically mean the model combines them well. The real design question is mechanical. At which point, and how, does an image token's information actually reach a text token's computation, and back the other way. Two patterns cover most real systems.
      </Paragraph>

      <Paragraph delay={0.55}>
        The first pattern, usually called <strong>early fusion</strong> or unified fusion, is the simpler idea. Dump every image token and every text token into one long sequence, and run one shared transformer over the whole thing. Self-attention lets any position look at any other position, so an image patch near the dog's face and the word "dog" can attend directly to each other starting in the very first layer, with nothing standing in between. Many of the newer any-to-any models that handle several modalities at once use exactly this shape, since it treats every modality identically and needs no modality-specific plumbing beyond the tokenizer.
      </Paragraph>

      <Paragraph delay={0.60}>
        The second pattern, <strong>cross-attention fusion</strong>, keeps the two modalities more separate. A dedicated vision encoder processes the image on its own and produces a set of image features. The text side runs its own transformer layers over the text tokens, and at certain layers, instead of mixing image tokens directly into the text sequence, the text tokens cross-attend into the vision encoder's output. The query comes from text, the key and value come from the image, the same query-key-value mechanism as ordinary self-attention, just drawing its key and value from a different sequence than its query. Earlier vision-language architectures, Flamingo among them, used this shape.
      </Paragraph>

      <Paragraph delay={0.65}>
        The tradeoff between the two is mostly about cost against depth of mixing. Unified fusion lets the model reason jointly about image and text from the very first layer, but every layer has to process every token of every modality, so a long caption sitting next to a big grid of image patches makes every single layer more expensive. Cross-attention fusion is cheaper, since the vision encoder only runs once and the text side does its expensive per-layer work over a usually much shorter sequence, but it caps how deeply the two modalities can mix, because image information only enters at the specific layers where a cross-attention step was placed.
      </Paragraph>

      <ReplicationDiagram panels={fusionPanels} delay={0.08} />

      <IconArchitectureDiagram
        delay={0.08}
        height={460}
        nodes={flowNodes}
        edges={flowEdges}
        caption="Image tokens and text tokens each start in their own encoder, then either get concatenated into one sequence or cross-attend into each other, before a shared backbone produces an answer."
      />

      <Heading level={2} delay={0.70}>
        Understanding and generation from the same model
      </Heading>

      <Paragraph delay={0.75}>
        Everything so far describes a model that reads both modalities and produces text, answering a question about a photo, writing a caption for it. The more ambitious version of a multimodal model also generates images, not just descriptions of them. The same network that can tell you what's in a photo should, in principle, also be able to draw one.
      </Paragraph>

      <Paragraph delay={0.80}>
        The cleanest way to get there reuses everything patchification and discrete visual tokenizers already built. If an image is a sequence of discrete codebook indices, generating an image becomes exactly the same problem as generating text, predict the next token, over and over, conditioned on everything produced so far. A model that already does next-token prediction for words can, in principle, do next-token prediction for image codebook indices too, using the same architecture and the same loss. Some systems take a different route and bolt a diffusion decoder onto a shared multimodal backbone instead. The backbone still reasons over image and text tokens together, but the actual pixels get produced by a separate denoising process rather than one token at a time.
      </Paragraph>

      <Paragraph delay={0.85}>
        This sounds like it should just work by reusing the same tokenizer on both sides, but understanding and generation actually want different things from a codebook. Understanding tasks want compressed, semantic tokens, a codebook entry that captures "this patch is part of a dog's ear" is more useful for answering a question than one that captures the ear's exact texture. Generation tasks want the opposite, tokens that reconstruct pixel detail faithfully, since a generated image that's semantically right but blurry or textureless still looks wrong. Optimizing one codebook for both goals at once means two somewhat competing objectives pulling against each other, and a real chunk of the research on unified generation-and-understanding models is about managing that tension, sometimes with two separate tokenizers, sometimes with one tokenizer trained on a loss that tries to balance both.
      </Paragraph>

      <Heading level={2} delay={0.90}>
        Two ways to align modalities
      </Heading>

      <Paragraph delay={0.95}>
        None of this works unless the model actually connects what an image looks like to what a sentence about it means. Two very different training signals create that connection.
      </Paragraph>

      <Paragraph delay={1.00}>
        One is <strong>contrastive alignment</strong>, the same mechanism behind CLIP-style training. Pull a genuinely matching image and caption together in embedding space, and push every non-matching pair in the training batch apart. The training signal here comes purely from which image goes with which caption, nothing about generating anything.
      </Paragraph>

      <Paragraph delay={1.05}>
        The other signal is <strong>generative alignment</strong>, sometimes called next-token alignment. Instead of directly optimizing distances in an embedding space, train the model to predict one modality conditioned on the other, predict the caption's tokens given the image, or predict the image's tokens given the caption. Nothing in that loss explicitly asks the model to align the two modalities, but it can't get the prediction right without doing so anyway, so alignment falls out as a side effect of an ordinary language-modeling loss. Most of today's large any-to-any models lean heavily on this second kind, since it's the same loss that already trains the rest of the model, with no separate contrastive objective bolted on.
      </Paragraph>

      <Heading level={2} delay={1.10}>
        Evaluating beyond a single modality
      </Heading>

      <Paragraph delay={1.15}>
        A model that handles two modalities needs to be evaluated on how well it actually uses both together, and a single-modality number, an image classification accuracy, a language-modeling perplexity, doesn't tell you that.
      </Paragraph>

      <List delay={1.20}>
        <ListItem>Visual question answering checks whether the model actually looks at the image to answer, or guesses from language priors alone. Getting "what color is a banana" right without ever checking the picture isn't evidence the model can see.</ListItem>
        <ListItem>Cross-modal retrieval checks whether, given a caption, the model can find the matching image out of a large pool of distractors, and the other way around. Retrieval quality is a direct check on whether the shared embedding space actually organizes by meaning.</ListItem>
        <ListItem>Hallucination on visual detail checks whether the model describes something that isn't actually in the image, a second dog that was never there, a color the object doesn't have. It's the multimodal version of a language model making up a fact.</ListItem>
        <ListItem>Compositional or binding tests check whether the model can correctly attribute a property to the right object, "the red cube is on top of the blue one," rather than a description that just proves the model noticed both colors exist somewhere without tying either color to the right object.</ListItem>
      </List>

      <Heading level={2} delay={1.25}>
        Takeaways
      </Heading>

      <List delay={1.30}>
        <ListItem>Multimodal models work by turning every modality into the same token-shaped sequence, continuous patch embeddings for images, discrete codebook indices for a fully token-based version, so one transformer can read across modalities instead of gluing separate models together.</ListItem>
        <ListItem>Fusion is a real architectural choice, not a detail. Unified fusion mixes every token together starting at the first layer and pays for it in compute, cross-attention fusion keeps a separate vision encoder and mixes more cheaply but at fewer points.</ListItem>
        <ListItem>Making one model both understand and generate images is genuinely hard, because a compressed token good for understanding and a detailed token good for pixel-faithful generation pull in different directions.</ListItem>
        <ListItem>Contrastive alignment and generative alignment connect modalities in different ways, one trained purely on which pairs match, the other trained to predict one modality from the other and getting alignment as a side effect.</ListItem>
        <ListItem>Single-modality benchmarks can't catch whether a model is actually using an image, so watch for hallucinated visual detail and broken attribute binding specifically.</ListItem>
      </List>

      <Paragraph delay={1.35}>
        Zoom out and the whole multimodal story is really one idea reused a few times, agree on a shared representation, then decide how much two representations get to talk to each other and when. The beach photo and its caption pass through patchification or a codebook, through one fusion mechanism or another, and come out the other side aligned well enough that a question about the picture actually gets answered from the picture, not from a guess. Thanks for reading.
      </Paragraph>
    </>
  ),
};
