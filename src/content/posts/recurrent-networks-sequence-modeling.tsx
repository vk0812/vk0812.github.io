import { BlogPostData } from "./types";
import {
  Paragraph,
  Heading,
  CodeBlock,
  Formula,
  List,
  ListItem,
  UnrolledRNNDiagram,
  LSTMCellDiagram,
  GradientMagnitudeChart,
} from "../components";

export const recurrentNetworksSequenceModeling: BlogPostData = {
  title: "Recurrent Networks and Sequence Modeling",
  date: "August 1, 2026",
  slug: "recurrent-networks-sequence-modeling",
  content: (
    <>
      <Paragraph delay={0.10}>
        A feedforward network looks at an input and produces an output, and that's the whole story. Feed it the same image twice, in any order, and it doesn't care. There's no notion of "before" or "after" anywhere in the computation. That's fine for images, but it falls apart the moment order is the whole point. "Dog bites man" and "man bites dog" have the exact same words. A stock price from Monday means something different depending on what happened the four days before it. Language, audio, sensor readings, anything that unfolds in time needs a model that can carry information from one step to the next.
      </Paragraph>

      <Paragraph delay={0.15}>
        Recurrent networks are the classic answer to that problem. The idea predates the current deep learning wave by decades, and even though attention-based models have taken over most of the headline applications, the mechanics of recurrence, and specifically why plain recurrence struggles over long sequences, are still the cleanest way to understand what problem attention was actually built to solve.
      </Paragraph>

      <Heading level={2} delay={0.20}>
        A hidden state carried across time
      </Heading>

      <Paragraph delay={0.25}>
        A recurrent network processes a sequence one element at a time and keeps a running summary of everything it has seen so far, called the hidden state. At each timestep <Formula>{`t`}</Formula>, it takes the current input <Formula>{`x_t`}</Formula> and the previous hidden state <Formula>{`h_{t-1}`}</Formula>, and produces a new hidden state.
      </Paragraph>

      <Formula block delay={0.30}>
        {`h_t = \\tanh(W_{xh} x_t + W_{hh} h_{t-1} + b_h)`}
      </Formula>

      <Paragraph delay={0.35}>
        The detail that matters most here is easy to miss on a first read. <Formula>{`W_{xh}`}</Formula>, <Formula>{`W_{hh}`}</Formula>, and <Formula>{`b_h`}</Formula> do not change from one timestep to the next. The same three weight objects get reused at every single position in the sequence, whether the sequence has five elements or five hundred. That's <strong>parameter sharing across time</strong>, and it's what makes a recurrent network different from just stacking five hundred separate feedforward layers, one for each position. A separate layer per position would need a separate set of weights per position too, and it would have no way to handle a sequence longer than whatever it was built for. Sharing the same update rule at every step means the network learns one general "how do I fold a new input into my summary so far" function, and applies it uniformly no matter how long the sequence runs.
      </Paragraph>

      <Paragraph delay={0.40}>
        A separate weight matrix, usually called <Formula>{`W_{hy}`}</Formula>, turns the hidden state at each step into whatever output the task needs, a predicted next word, a classification, a single number. Unrolling this recurrence across five timesteps makes the sharing visible directly.
      </Paragraph>

      <UnrolledRNNDiagram
        delay={0.08}
        caption="The recurrence unrolled across five timesteps. Every arrow labeled W_hh is the identical matrix, and the same is true of W_xh and W_hy at every column."
      />

      <Heading level={2} delay={0.45}>
        A worked forward pass, with real numbers
      </Heading>

      <Paragraph delay={0.50}>
        It helps to see the actual arithmetic once with small, concrete numbers rather than only the abstract equation. Take a hidden size of 2, an input size of 2, and fixed weights, then run five real inputs through the recurrence by hand (well, with numpy, but nothing here is symbolic or approximate).
      </Paragraph>

      <CodeBlock
        delay={0.55}
        language="Python"
        code={`import numpy as np

Wxh = np.array([[0.5, -0.3],
                [0.2,  0.4]])
Whh = np.array([[0.6, -0.2],
                [0.1,  0.5]])
bh  = np.array([0.0, 0.1])

def rnn_step(h_prev, x):
    z = Wxh @ x + Whh @ h_prev + bh
    return np.tanh(z), z

X = [np.array([1.0, 0.0]),
     np.array([0.5, 0.5]),
     np.array([-1.0, 1.0]),
     np.array([0.2, -0.4]),
     np.array([0.0, 0.3])]

h = np.zeros(2)
for t, x in enumerate(X, start=1):
    h, z = rnn_step(h, x)
    print(f"t={t}  z={z}  h={h}")

# t=1  z=[0.5    0.3   ]  h=[0.4621 0.2913]
# t=2  z=[0.319  0.5919]  h=[0.3086 0.5312]
# t=3  z=[-0.7211 0.5965]  h=[-0.6176 0.5345]
# t=4  z=[-0.2575 0.1855]  h=[-0.2519 0.1834]
# t=5  z=[-0.2778 0.2865]  h=[-0.2709 0.2789]`}
      />

      <Paragraph delay={0.60}>
        Notice how <Formula>{`h_1`}</Formula> depends only on <Formula>{`x_1`}</Formula> starting from a zero hidden state. But by <Formula>{`h_3`}</Formula> the vector <Formula>{`[-0.6176, 0.5345]`}</Formula> is a genuine mixture of everything since the start: <Formula>{`x_1`}</Formula>, <Formula>{`x_2`}</Formula>, and <Formula>{`x_3`}</Formula> have all been folded together through the same two weight matrices, applied three times in a row. That folding is exactly what gives a recurrent network memory, and it's also exactly what makes training one harder than training a feedforward network.
      </Paragraph>

      <Heading level={2} delay={0.65}>
        Backpropagation through time
      </Heading>

      <Paragraph delay={0.70}>
        Training a recurrent network means unrolling it, treating the five copies of the update rule in the diagram above as five distinct layers of one deep feedforward network, and running ordinary backpropagation through that unrolled graph. This is called <strong>backpropagation through time</strong> (BPTT). The wrinkle is that a loss computed at the last timestep depends on the hidden state at every earlier timestep, so the gradient with respect to an early hidden state has to travel back through every step in between.
      </Paragraph>

      <Formula block delay={0.75}>
        {`\\frac{\\partial h_T}{\\partial h_k} = \\prod_{t=k+1}^{T} \\frac{\\partial h_t}{\\partial h_{t-1}}`}
      </Formula>

      <Paragraph delay={0.80}>
        Each individual factor <Formula>{`\\partial h_t / \\partial h_{t-1}`}</Formula> is a Jacobian matrix, specifically <Formula>{`\\operatorname{diag}(1 - h_t^2) \\, W_{hh}`}</Formula> for the tanh update above, the derivative of tanh applied elementwise, multiplied by the recurrent weight matrix. Getting the gradient from timestep <Formula>{`T`}</Formula> back to some earlier timestep <Formula>{`k`}</Formula> means multiplying <Formula>{`T - k`}</Formula> of these Jacobians together. That repeated multiplication is the single most important fact about training recurrent networks, and it's worth sitting with, because it's the direct cause of the next section's problem.
      </Paragraph>

      <Heading level={2} delay={0.85}>
        Why gradients vanish (or explode) over long sequences
      </Heading>

      <Paragraph delay={0.90}>
        Two things make that product of Jacobians dangerous. Tanh's derivative is always at most 1, and it's noticeably smaller than 1 wherever the hidden state is already saturated toward +1 or -1. And the recurrent weight matrix <Formula>{`W_{hh}`}</Formula> has its own scale, captured by its largest singular value, sometimes called its spectral norm. If that combined scale is consistently below 1, every extra step back in time multiplies the gradient by another factor smaller than 1, and the product shrinks toward zero exponentially fast. If it's consistently above 1, the opposite happens, and the gradient blows up toward infinity. Either way, the network effectively can't learn from anything more than a handful of steps back, dominated either by numerical noise or by a gradient so huge the optimizer takes a wild, useless step.
      </Paragraph>

      <Paragraph delay={0.95}>
        The numbers from the worked example above show the shrinking case directly, no illustration needed. <Formula>{`W_{hh}`}</Formula>'s spectral norm here is <Formula>{`0.6408`}</Formula>, comfortably below 1, and tanh's derivative at each of the five hidden states computed earlier ranges from about <Formula>{`0.40`}</Formula> to <Formula>{`0.60`}</Formula>. Multiplying the actual per-step Jacobians together, going backward from <Formula>{`h_5`}</Formula>, gives the norm of <Formula>{`\\partial h_5 / \\partial h_k`}</Formula> at each earlier <Formula>{`k`}</Formula>.
      </Paragraph>

      <GradientMagnitudeChart
        delay={1.00}
        caption="The gradient norm from h5 back to each earlier hidden state, computed from the same weights and inputs as the forward pass above. Five steps back it has already fallen by more than 25x."
      />

      <Paragraph delay={1.05}>
        Five steps back, the gradient's magnitude has dropped from 1.0 to about 0.0365, a factor of roughly 27. Extend the sequence to fifty or a hundred steps with this same kind of weight matrix and the gradient reaching the earliest timesteps is indistinguishable from zero in floating point. The network trains fine on whatever happened recently and is simply unable to adjust its weights based on anything from far in the past, not because the information isn't relevant, but because the gradient carrying that information decayed to nothing on the way back. This connects to the same broader activation and gradient flow concerns that show up in very deep feedforward networks. From the optimizer's point of view, a recurrent network unrolled over a hundred timesteps is a hundred-layer-deep network, and it inherits all the same difficulties, just guaranteed to happen every time rather than depending on how the layers happen to be initialized.
      </Paragraph>

      <Heading level={2} delay={1.10}>
        LSTM gates, fixing the multiplicative path
      </Heading>

      <Paragraph delay={1.15}>
        The <strong>Long Short-Term Memory</strong> (LSTM) architecture was designed specifically to break that repeated multiplication. Instead of relying purely on a hidden state that gets rewritten in full at every step, an LSTM keeps a second piece of state called the <strong>cell state</strong>, <Formula>{`C_t`}</Formula>, which is updated <em>additively</em> rather than by being fed back through a matrix multiply and a squashing nonlinearity every time.
      </Paragraph>

      <Formula block delay={1.20}>
        {`C_t = f_t \\odot C_{t-1} + i_t \\odot \\tilde{C}_t`}
      </Formula>

      <Paragraph delay={1.25}>
        Three gates, each a sigmoid applied to a linear combination of <Formula>{`h_{t-1}`}</Formula> and <Formula>{`x_t`}</Formula>, control that update. The <strong>forget gate</strong> <Formula>{`f_t`}</Formula> decides how much of the old cell state to keep. The <strong>input gate</strong> <Formula>{`i_t`}</Formula> decides how much of a new candidate value <Formula>{`\\tilde{C}_t`}</Formula> (itself a tanh of the same inputs) gets written in. The <strong>output gate</strong> <Formula>{`o_t`}</Formula> decides how much of the cell state gets exposed as the hidden state, <Formula>{`h_t = o_t \\odot \\tanh(C_t)`}</Formula>.
      </Paragraph>

      <LSTMCellDiagram
        delay={0.08}
        caption="The cell state flows across the top with only elementwise multiplication and addition. The three gates read the previous hidden state and current input, and decide what to keep, add, and expose."
      />

      <Paragraph delay={1.30}>
        The gradient flowing backward through the cell state now has to pass through <Formula>{`f_t`}</Formula>, an elementwise multiply, instead of a full matrix multiply followed by a squashing derivative. If the network learns to set a forget gate near 1 for information it wants to preserve, the gradient through that path is multiplied by something close to 1 rather than by a fixed sub-1 factor at every single step. This doesn't make vanishing gradients impossible in an LSTM. A forget gate can still learn to be small, closing off that path deliberately. But it gives the network an actual mechanism to choose to preserve gradient flow when the task calls for it, which a plain recurrent network never had. That's the whole idea behind gating, not a bigger network, just a switch that can be set to nearly lossless.
      </Paragraph>

      <Heading level={2} delay={1.35}>
        GRU, a simplified alternative
      </Heading>

      <Paragraph delay={1.40}>
        The <strong>Gated Recurrent Unit</strong> (GRU) keeps the gating idea but drops the separate cell state entirely, folding everything into a single hidden state. It has two gates instead of three, an <strong>update gate</strong> <Formula>{`z_t`}</Formula> that plays the combined role of the forget and input gates, and a <strong>reset gate</strong> <Formula>{`r_t`}</Formula> that controls how much of the previous hidden state feeds into the new candidate.
      </Paragraph>

      <Formula block delay={1.45}>
        {`h_t = (1 - z_t) \\odot h_{t-1} + z_t \\odot \\tilde{h}_t`}
      </Formula>

      <Paragraph delay={1.50}>
        That's the same additive shape as the LSTM's cell update, <Formula>{`(1 - z_t)`}</Formula> and <Formula>{`z_t`}</Formula> partition responsibility between keeping the old state and writing a new candidate, so the same gradient-preserving argument applies. With fewer gates and no separate cell state, a GRU has fewer parameters than an LSTM of the same hidden size, trains a bit faster, and on plenty of tasks reaches comparable accuracy. There's no universal winner between the two, it's common to just try both on a given dataset and see which one validates better.
      </Paragraph>

      <Heading level={2} delay={1.55}>
        Bidirectional RNNs
      </Heading>

      <Paragraph delay={1.60}>
        Everything above processes a sequence left to right, which makes sense when the future genuinely hasn't happened yet, generating text one token at a time, for instance. But plenty of tasks have the entire sequence available before any prediction is needed, tagging every word in a finished sentence with its part of speech, say. In that setting there's no reason to only look backward. A <strong>bidirectional RNN</strong> runs two independent recurrent networks over the same sequence, one reading left to right, one reading right to left, and concatenates their hidden states at each position.
      </Paragraph>

      <Paragraph delay={1.65}>
        The result at position <Formula>{`t`}</Formula> has seen both everything before it and everything after it, which is strictly more context than a one-directional network can offer at that same position. The tradeoff is that a bidirectional network can't be used for anything that has to produce output before the full sequence exists. It needs the whole input up front, so it shows up in tagging and classification tasks far more than in generation tasks.
      </Paragraph>

      <Heading level={2} delay={1.70}>
        Sequence to sequence, an encoder and a decoder
      </Heading>

      <Paragraph delay={1.75}>
        A lot of useful problems map one whole sequence to a different whole sequence, translating an English sentence into French, turning an audio clip into a transcript. The classic recurrent solution is a <strong>sequence to sequence</strong> (seq2seq) model, built from two separate recurrent networks. An <strong>encoder</strong> reads the entire input sequence and compresses it into a final hidden state, sometimes called the context vector. A <strong>decoder</strong>, a separate recurrent network, is initialized from that context vector and generates the output sequence one token at a time, feeding each generated token back in as the input to the next step.
      </Paragraph>

      <Paragraph delay={1.80}>
        The whole burden of "everything relevant about the input sentence" has to be squeezed into that single fixed-size context vector, no matter how long the input sentence was. That's a real bottleneck, and it's worth keeping in mind for later: it's the exact limitation that the next major architectural idea after recurrence was built to remove.
      </Paragraph>

      <Heading level={2} delay={1.85}>
        Teacher forcing and exposure bias
      </Heading>

      <Paragraph delay={1.90}>
        Training a decoder to generate a sequence token by token creates a choice. At each step, should the decoder condition on the token it just predicted, or on the actual correct token from the training data? <strong>Teacher forcing</strong> is the standard answer during training, always feed the ground truth previous token as input, regardless of what the model itself would have predicted. This makes training dramatically more stable and much faster to converge, because one wrong early prediction can't drag every later step off course, each step always starts from the correct history.
      </Paragraph>

      <Paragraph delay={1.95}>
        The problem shows up at inference time, when there's no ground truth to feed in anymore. The decoder has to condition on its own previous outputs, including any mistakes it made a few steps earlier, a situation it essentially never practiced during training. This mismatch between the training distribution (always correct history) and the inference distribution (possibly wrong, self-generated history) is called <strong>exposure bias</strong>. A single early error can compound, since every later step is now conditioning on a token the model never would have seen paired with that context during training. Various fixes exist, scheduled sampling gradually mixes in the model's own predictions during training, for example, but none of them eliminate the mismatch entirely, they only narrow it.
      </Paragraph>

      <Heading level={2} delay={2.00}>
        Where recurrence runs out
      </Heading>

      <Paragraph delay={2.05}>
        Gating pushed the practical range of "how far back can gradient meaningfully travel" much further than a plain RNN could manage, and it made recurrent networks genuinely useful for real sequence tasks for a couple of decades. But two limitations remain even with an LSTM or a GRU doing the recurrence. The vanishing gradient problem is reduced, not eliminated: extremely long sequences can still overwhelm the gates' ability to preserve signal. And the sequence to sequence bottleneck from above is structural, no amount of better gating changes the fact that a fixed-size context vector has to represent an arbitrarily long input.
      </Paragraph>

      <Paragraph delay={2.10}>
        Attention mechanisms, and the transformer architectures built around them, address both of these by giving the decoder direct access to every encoder position instead of forcing all of that information through one hidden state and one sequential path. That's a large enough idea to deserve its own treatment rather than a few sentences here. But it's worth naming clearly: attention wasn't invented in a vacuum. It was invented specifically to route around the two problems this post just walked through by hand.
      </Paragraph>

      <Heading level={2} delay={2.15}>
        Takeaways
      </Heading>

      <List delay={2.20}>
        <ListItem>A recurrent network reuses the exact same weight matrices at every timestep, folding a growing history into a fixed-size hidden state one step at a time.</ListItem>
        <ListItem>Training requires unrolling the recurrence and backpropagating through it, which means multiplying a Jacobian together once per timestep, and that repeated multiplication is what makes gradients shrink or blow up over long sequences.</ListItem>
        <ListItem>LSTM and GRU gates replace that multiplicative path with a mostly additive one through a cell state (or gated hidden state), giving the network an actual mechanism to preserve gradient flow across long gaps.</ListItem>
        <ListItem>Bidirectional RNNs, sequence to sequence framing, and teacher forcing are all practical adaptations layered on top of the same core recurrence, each with its own tradeoff, no future context without seeing the whole sequence first, a fixed-size context vector bottleneck, and a train and inference mismatch called exposure bias.</ListItem>
        <ListItem>Even gated recurrence has a ceiling on how far gradient signal can travel and how much a single context vector can hold, which is precisely the gap attention and transformer architectures were built to close.</ListItem>
      </List>

      <Paragraph delay={2.25}>
        Recurrence is a genuinely simple idea: carry a summary forward, update it one step at a time, reuse the same rule everywhere. Most of the complexity that got added on top, gates, bidirectionality, encoder decoder splits, teacher forcing, exists to patch specific failure modes of that simple idea rather than to replace it. Understanding those failure modes by hand, with real gradients that actually shrink in front of you, makes it a lot clearer why the field eventually moved toward an architecture that doesn't process a sequence step by step at all. Thanks for reading.
      </Paragraph>
    </>
  ),
};
