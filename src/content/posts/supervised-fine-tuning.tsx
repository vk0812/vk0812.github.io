import { BlogPostData } from "./types";
import {
  Paragraph,
  Heading,
  CodeBlock,
  InlineCode,
  Formula,
  List,
  ListItem,
  IconArchitectureDiagram,
  DiagramNode,
  DiagramEdge,
  ReplicationDiagram,
} from "../components";
import { Brain, GraduationCap, Sparkles } from "lucide-react";
import { LossMaskDiagram } from "../components/animations/supervised-fine-tuning/ConceptViz";

const pipelineNodes: DiagramNode[] = [
  { id: "pretrain", label: "Pretraining", sub: "next-token prediction on raw text", icon: Brain, color: "text-slate-500", x: 15, y: 50 },
  { id: "sft", label: "Supervised fine-tuning", sub: "chat data, assistant-only loss", icon: GraduationCap, color: "text-blue-500", x: 50, y: 50 },
  { id: "align", label: "Preference alignment", sub: "RLHF or DPO, a later stage", icon: Sparkles, color: "text-emerald-500", x: 85, y: 50 },
];

const pipelineEdges: DiagramEdge[] = [
  { id: "pretrain-sft", from: "pretrain", to: "sft" },
  { id: "sft-align", from: "sft", to: "align" },
];

export const supervisedFineTuning: BlogPostData = {
  title: "Supervised Fine-Tuning",
  date: "August 11, 2026",
  slug: "supervised-fine-tuning",
  content: (
    <>
      <Paragraph delay={0.10}>
        Ask a freshly pretrained language model to "write a Python function that reverses a string," and there's a good chance it doesn't answer at all. Instead it might continue with "write a Python function that checks if a number is prime," then another exercise, then another, because somewhere in its training data that looks exactly like a homework worksheet, and a worksheet's most likely continuation is another question, not a solved answer. The model isn't being difficult. It's doing exactly what it was trained to do, predict the next plausible chunk of text, and a list of exercises is a perfectly plausible continuation of a list of exercises.
      </Paragraph>

      <Paragraph delay={0.15}>
        Supervised fine-tuning, usually shortened to SFT, is the step that fixes this. It takes a pretrained model, one that already knows an enormous amount about language and the world just from predicting text, and teaches it a much narrower, much more useful skill on top, recognizing when it's being asked something and actually answering. This post walks through what SFT data looks like, how it gets fed into the model, and what SFT does and doesn't change about a model once it's done.
      </Paragraph>

      <Heading level={2} delay={0.20}>
        What instruction data actually looks like
      </Heading>

      <Paragraph delay={0.25}>
        SFT training examples are conversations, not documents. Each one has a sequence of turns, and each turn has a role attached to it. A simple example might look like this.
      </Paragraph>

      <List delay={0.30}>
        <ListItem><strong>System.</strong> "You are a helpful assistant." A short instruction that sets the model's overall behavior for the whole conversation. Not every example has one.</ListItem>
        <ListItem><strong>User.</strong> "What's 2 + 2?" The actual request.</ListItem>
        <ListItem><strong>Assistant.</strong> "2 + 2 = 4." The response the model is being trained to produce.</ListItem>
      </List>

      <Paragraph delay={0.35}>
        A real SFT dataset is a large pile of examples shaped like that one, some single-turn like the example above, plenty multi-turn, going back and forth several times the way an actual conversation does. Dataset sizes vary a lot depending on the goal, anywhere from a few thousand carefully written examples to several million, gathered from human writers, existing question-answer data reshaped into conversations, or another model's own outputs. What matters for training isn't just having a pile of text, it's having text that's already split into turns with a role attached to each one, because that role is exactly what tells the training process which words the model should learn to say and which words it should just learn to read.
      </Paragraph>

      <Heading level={2} delay={0.40}>
        Turning a conversation into one sequence, chat templates
      </Heading>

      <Paragraph delay={0.45}>
        A language model doesn't have a native concept of "roles" or "turns." Under the hood it only ever sees one flat sequence of tokens. So before any of this data can be trained on, every conversation has to get flattened into a single string, with something marking where one turn ends and the next begins. That flattening rule is called a <strong>chat template</strong>, and it's applied the same way every single time, both during training and later, whenever anyone actually talks to the finished model.
      </Paragraph>

      <Paragraph delay={0.50}>
        A template usually works by wrapping each turn in a pair of special tokens that name the role, tokens the model's vocabulary reserves just for this purpose and that never show up in ordinary text. Applying a template to the three-turn example above might produce something like this.
      </Paragraph>

      <CodeBlock
        delay={0.55}
        language="Text"
        code={`<|system|>
You are a helpful assistant.
<|end|>
<|user|>
What's 2 + 2?
<|end|>
<|assistant|>
2 + 2 = 4.
<|end|>`}
      />

      <Paragraph delay={0.60}>
        That's the entire conversation as one token sequence, which is the only shape a transformer actually understands. Every model family fixes its own exact template, its own choice of special tokens, its own spacing, and it matters that training and later real usage apply that exact same template. A model trained on one layout and then prompted with a slightly different one at inference time is effectively seeing a shape of input it never learned, and quality quietly degrades.
      </Paragraph>

      <Heading level={2} delay={0.65}>
        Assistant-only loss, training on the model's own words only
      </Heading>

      <Paragraph delay={0.70}>
        Here's the part that's easy to get wrong if you just take the flattened sequence above and train on it the ordinary way. The ordinary way a language model trains is next-token prediction, at every position, predict the next token, compare it to what actually comes next, and turn that difference into a gradient. Do that naively over the whole sequence above, and the model spends just as much gradient learning to predict "What's 2 + 2?" as it spends learning to predict "2 + 2 = 4." That's backwards. Nobody wants a model that's good at guessing what a user is about to type. What SFT actually wants is a model that's good at producing the right response once it's seen a request.
      </Paragraph>

      <Paragraph delay={0.75}>
        The fix is called <strong>assistant-only loss</strong>, sometimes just described as masking the loss on everything except the assistant's own turns. Every position in the sequence still gets a next-token prediction, that part of the forward pass doesn't change, but a binary mask decides which positions actually contribute to the loss that gets backpropagated. Positions inside the system message and the user's turn get a mask value of zero, meaning their prediction error is computed but thrown away. Positions inside the assistant's own response, plus the token that marks the end of its turn, get a mask value of one, meaning those are the only predictions the model actually gets penalized for getting wrong.
      </Paragraph>

      <Formula block delay={0.80}>
        {`\\mathcal{L}(\\theta) = -\\frac{1}{\\sum_t m_t} \\sum_{t=1}^{T} m_t \\, \\log p_\\theta(x_t \\mid x_{<t})`}
      </Formula>

      <Paragraph delay={0.85}>
        Reading it left to right, <Formula>{`p_\\theta(x_t \\mid x_{<t})`}</Formula> is the model's predicted probability of the actual next token <Formula>{`x_t`}</Formula>, given everything before it, exactly the quantity an ordinary language model loss uses. <Formula>{`m_t`}</Formula> is the mask, <Formula>{`1`}</Formula> if position <Formula>{`t`}</Formula> belongs to an assistant turn, <Formula>{`0`}</Formula> otherwise. Multiplying by <Formula>{`m_t`}</Formula> zeroes out every masked position's contribution before it's summed, and dividing by <Formula>{`\\sum_t m_t`}</Formula>, the total count of unmasked positions, keeps the loss an average over the tokens that actually count instead of getting diluted by a long masked prompt.
      </Paragraph>

      <LossMaskDiagram
        delay={0.06}
        caption="The rendered chat template split into its chunks. The system message, the user's question, and even the assistant role tag are given to the model as context and carry no loss. Only the assistant's actual words, plus its end token, are what the loss trains the model to predict."
      />

      <Paragraph delay={0.90}>
        Notice that even the <InlineCode>{`<|assistant|>`}</InlineCode> tag itself stays masked. That token is handed to the model as a cue that it's now its turn to speak, it isn't something the model needs to learn to generate, since it's inserted by the template, not produced by the model. What the model does need to learn to generate is the content that follows it, and the end token that follows that, since producing that end token correctly is what lets the model learn when to stop talking.
      </Paragraph>

      <Heading level={2} delay={0.95}>
        Packing many short conversations into one sequence
      </Heading>

      <Paragraph delay={1.00}>
        Training runs process sequences of a fixed length, often a few thousand tokens, sometimes more. Most chat examples are nowhere near that long, a lot of real conversations are a couple hundred tokens once templated. Training each example in its own sequence, padded out with meaningless filler tokens to reach the fixed length, wastes most of the compute in every single training step on padding the model doesn't need to learn anything from.
      </Paragraph>

      <ReplicationDiagram
        delay={0.07}
        panels={[
          {
            title: "Without packing",
            writeLabel: "One training sequence, 4096 tokens long",
            fanLabel: "a single short conversation, then padding to fill the rest",
            nodes: ["Conversation A, 300 tokens", "Padding, 3796 tokens"],
            highlightNodes: [0],
            note: "Most of every sequence is wasted compute, the model just learns to skip over padding.",
          },
          {
            title: "With packing",
            writeLabel: "One training sequence, 4096 tokens long",
            fanLabel: "several short conversations concatenated back to back",
            nodes: ["Conversation B", "Conversation C", "Conversation D", "Conversation E"],
            highlightNodes: [0, 1, 2, 3],
            note: "Every position in the sequence carries real training signal, no padding tokens at all.",
          },
        ]}
      />

      <Paragraph delay={1.05}>
        <strong>Packing</strong> is the fix, concatenate several short, complete conversations back to back until the fixed sequence length fills up, separated by the same end token that already marks the end of a turn. The loss mask still works the same way it always does, per conversation, so conversation B's assistant tokens are unmasked while conversations C, D, and E sit there fully masked from B's point of view, and the same is true in reverse for each of the others. What differs across implementations is whether attention itself is also boundary-aware. Some training setups add an explicit mask so tokens in one packed conversation can't attend back into an earlier one sharing the same sequence, keeping the examples fully independent. Others skip that and just rely on the model learning, correctly, that an unrelated conversation a few hundred tokens back isn't relevant context worth attending to. Either way, packing turns a sequence that was mostly padding into a sequence that's nothing but real training signal.
      </Paragraph>

      <Heading level={2} delay={1.10}>
        Data mixtures
      </Heading>

      <Paragraph delay={1.15}>
        No single conversation style teaches a model everything it needs. A useful assistant has to hold a casual back and forth, write and debug code, work through a multi-step math problem, follow a formatting instruction exactly, and decline a request it shouldn't fulfill, and each of those is a genuinely different skill represented by a different slice of the training data. The <strong>data mixture</strong> is the recipe for how much of each slice goes into the final training set. Get the proportions wrong and the model overfits to whichever skill is overrepresented. Train almost entirely on casual chat and coding ability quietly gets worse, even though not a single coding example was removed, simply because the model's limited capacity for adapting during this stage got spent mostly on chat patterns instead. Getting the mixture right is usually an empirical exercise, train a run, evaluate it across every skill the model needs, adjust the proportions, and try again.
      </Paragraph>

      <Heading level={2} delay={1.20}>
        Full-parameter tuning
      </Heading>

      <Paragraph delay={1.25}>
        SFT usually updates every single weight in the network, not just a small new head or an adapter layer bolted on top. That's a meaningful choice, full-parameter tuning has more room to actually change how the model behaves than a lighter-weight adaptation method does, but it also means every weight is exposed to whatever the SFT data happens to contain. It gets combined with training choices that keep that exposure gentle, a learning rate far smaller than pretraining used, and usually just a handful of passes over the data, often only one to three, rather than the many passes a model might see during pretraining.
      </Paragraph>

      <Paragraph delay={1.30}>
        The reason for that caution is the same one that shows up anywhere a pretrained network gets updated further, catastrophic forgetting, updates that help on the new data can quietly erode capability the network already had. SFT's version of this has a specific shape. The dataset doing the fine-tuning is tiny compared to what the model originally pretrained on, so if the learning rate is too high or training runs for too many epochs, the model can drift away from the broad, general capability pretraining gave it and toward something narrowly overfit to the SFT set's own style and topics, at the cost of everything else it used to be able to do.
      </Paragraph>

      <Heading level={2} delay={1.35}>
        Validation and choosing a checkpoint
      </Heading>

      <Paragraph delay={1.40}>
        Because overshooting is a real risk, SFT training doesn't just watch the training loss and call it done. A held-out slice of conversations, never trained on, gets scored the same assistant-only way, and that validation loss is what actually indicates whether the model is still improving at the underlying skill or has started memorizing the specific phrasing of its training examples. Teams also often score checkpoints on a fixed set of held-out prompts, checking response quality directly, sometimes with human judgment, sometimes by comparing against a reference model's answers, since a lower validation loss doesn't automatically mean a person would rate the responses as better.
      </Paragraph>

      <Paragraph delay={1.45}>
        <strong>Checkpoint selection</strong> follows from that monitoring. Training saves a model snapshot periodically, every so many steps or at the end of every epoch, and the final step's checkpoint isn't automatically the one that ships. It's common for validation performance to peak partway through training and start sliding backward afterward, exactly the signature of the model overfitting the narrow SFT set and forgetting some of what pretraining gave it. Picking whichever checkpoint actually scored best on held-out data, instead of reflexively taking the last one, is a small step that avoids shipping a model quietly worse than one saved a few hundred steps earlier.
      </Paragraph>

      <Heading level={2} delay={1.50}>
        Behavior versus knowledge, what SFT actually changes
      </Heading>

      <Paragraph delay={1.55}>
        This is the conceptual piece worth being precise about. Pretraining is where a model's knowledge mostly comes from, everything it knows about the world, language, facts, code, reasoning patterns, gets built up from an enormous volume of raw text, far larger than any SFT dataset comes close to. SFT, by comparison, is comparatively tiny. What SFT is actually good at is reshaping <em>behavior</em>, how the model responds, what format it uses, what tone it takes, when it refuses, when it asks a clarifying question, how it signals that it's finished talking. None of that requires teaching the model new facts about the world. It requires teaching it a new way of using facts and abilities it already had.
      </Paragraph>

      <Paragraph delay={1.60}>
        This split has a practical consequence worth remembering. If an SFT example happens to state a fact the pretrained model never actually picked up, fine-tuning can teach the model to repeat that specific fact confidently, in that specific phrasing, without giving it any real, generalizable grasp of the underlying information. Some researchers describe this general pattern as a superficial alignment hypothesis, that most of a capable model's raw ability was already there from pretraining, and SFT is largely teaching a narrow response style on top of it rather than adding new depth underneath. It's a good reason to treat SFT data as a lesson in how to answer, not a textbook for what to know, and to expect a model's factual reliability to trace back mostly to what its pretraining actually covered.
      </Paragraph>

      <Heading level={2} delay={1.65}>
        Putting the pipeline together
      </Heading>

      <Paragraph delay={1.70}>
        Zooming out, SFT is one specific, well-defined step sitting between two much bigger ones.
      </Paragraph>

      <IconArchitectureDiagram
        delay={0.08}
        height={280}
        nodes={pipelineNodes}
        edges={pipelineEdges}
        caption="Pretraining supplies the knowledge, SFT teaches the model to behave like an assistant, and a later stage tunes it further against human preference."
      />

      <Paragraph delay={1.75}>
        What happens after SFT, the later stages that align a model more closely with human preference using techniques like RLHF or DPO, is its own separate topic. What matters here is that by the time a model reaches that stage, it can already hold a conversation, follow an instruction, and stop talking at the right point, entirely because of the chat data, the masking, and the training choices covered above.
      </Paragraph>

      <Heading level={2} delay={1.80}>
        Takeaways
      </Heading>

      <List delay={1.85}>
        <ListItem>SFT teaches a pretrained model to recognize and respond to instructions, using conversations flattened into one sequence by a fixed chat template.</ListItem>
        <ListItem>Assistant-only loss masks the loss on every token except the model's own turns, so gradient only ever comes from the words the model is actually meant to produce.</ListItem>
        <ListItem>Packing concatenates several short conversations into one fixed-length training sequence instead of padding each one separately, turning wasted compute into real training signal.</ListItem>
        <ListItem>Full-parameter tuning on a comparatively small, carefully mixed dataset needs a small learning rate and few epochs, or catastrophic forgetting erodes what pretraining built, which is exactly why validation loss and careful checkpoint selection matter more than trusting the final training step.</ListItem>
        <ListItem>SFT mostly reshapes behavior, tone, format, and refusal patterns, not knowledge, which comes overwhelmingly from pretraining on a much larger scale of data.</ListItem>
      </List>

      <Paragraph delay={1.90}>
        None of the individual pieces here are exotic, a template, a mask, some concatenation, a held-out validation set. What makes SFT work is that all of it together turns a model that only knows how to continue text into one that knows how to actually help. Thanks for reading.
      </Paragraph>
    </>
  ),
};
