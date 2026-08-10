# Applied machine learning and MLE blog roadmap

This is the long-term machine-learning roadmap for the site. It is deliberately broader than a list of model architectures: Applied ML and Machine Learning Engineering roles are expected to frame problems, build trustworthy datasets, train and evaluate models, deploy them, and keep them useful in production. The topics below cover that complete lifecycle without depending on any particular company or cloud.

The order is a learning path, not a requirement to publish every foundational post before writing an advanced one. Each numbered item is large enough to become one focused post; closely related items can become a short series.

## Already covered

- **Contrastive Learning**
  - Positive and negative pairs, dual encoders, normalized embeddings, similarity matrices, temperature, and symmetric contrastive loss.
- **Group Relative Policy Optimization**
  - Group-relative advantages, verifiable rewards, clipped policy updates, the KL penalty, and the differences from Proximal Policy Optimization.

Do not rewrite these two subjects. Future posts should link to them when discussing self-supervised representation learning or reinforcement-learning-based language-model post-training.

## Track 1: Mathematical and statistical foundations

1. **Probability for Machine Learning**
   - Random variables, common distributions, joint and conditional probability, Bayes' rule, expectation, variance, covariance, independence, likelihood, and log-likelihood.
2. **Statistics, Estimation, and Uncertainty**
   - Sampling, estimators, bias and variance, maximum-likelihood estimation, confidence intervals, bootstrapping, hypothesis tests, and multiple-comparison pitfalls.
3. **Information Theory for ML**
   - Entropy, cross-entropy, conditional entropy, Kullback-Leibler divergence, mutual information, perplexity, and how they connect to classification, compression, representation learning, and language models.
4. **Optimization Fundamentals**
   - Convexity, constrained optimization, Lagrange multipliers, gradient descent, stochastic optimization, momentum, conditioning, saddle points, and why deep-learning objectives behave differently from convex problems.
5. **Generalization and the Bias-Variance Trade-off**
   - Underfitting, overfitting, model capacity, inductive bias, regularization, learning curves, distribution assumptions, and the limits of judging a model from training loss.

## Track 2: Classical machine learning

22. **Linear Regression from First Principles**
    - Ordinary least squares, assumptions, residuals, gradients.
23. **Regularized Linear Models**
    - Ridge, Lasso, Elastic Net, coefficient shrinkage, sparsity, multicollinearity, feature scaling, regularization paths, and cross-validated penalty selection.
24. **Logistic Regression and Generalized Linear Models**
    - Log-odds, maximum likelihood, cross-entropy, multiclass strategies, interpretation, calibration, and decision thresholds.
25. **Decision Trees**
    - Entropy and Gini impurity, regression splits, pruning, missing values, feature importance, instability, and the bias-variance behavior of trees.
26. **Bagging and Random Forests**
    - Bootstrap samples, random feature subsets, out-of-bag evaluation, variance reduction, probability estimates, feature importance caveats, and Extra Trees.
27. **Gradient-Boosted Decision Trees**
    - Additive models, residual fitting, learning rate and tree-depth trade-offs, regularization, categorical handling, early stopping, missing values, and why boosting is a tabular-data baseline.
28. **Support Vector Machines and Kernel Methods**
    - Maximum-margin classification, hinge loss, soft margins, the kernel trick, common kernels, support-vector regression, scaling behavior, and when kernels remain useful.
29. **Nearest Neighbors and Instance-Based Learning**
    - Distance metrics, normalization, the curse of dimensionality, exact versus approximate search, weighting neighbors, indexing, latency, and memory trade-offs.
30. **Naive Bayes and Probabilistic Classifiers**
    - Conditional independence, Gaussian, multinomial, and Bernoulli variants, log probabilities, smoothing, text classification, calibration, and failure modes.
31. **Clustering**
    - K-means, hierarchical clustering, density-based clustering, choosing distance and cluster count, cluster validation, stability, and turning clusters into product decisions.
32. **Dimensionality Reduction and Manifold Learning**
    - Principal component analysis, singular value decomposition, independent component analysis, random projections, t-SNE, UMAP, visualization traps, and preserving structure.
36. **Learning to Rank**
    - Pointwise, pairwise, and listwise objectives; relevance labels; ranking losses; NDCG, MAP, and MRR; position bias; negative sampling; calibration; and offline-online metric gaps.

## Track 3: Evaluation, experimentation, and diagnosis

37. **Classification Metrics and Decision Thresholds**
    - Confusion matrices, precision, recall, specificity, F-scores, ROC-AUC, PR-AUC, top-k metrics, cost-sensitive thresholds, micro/macro averaging, and metric choice under imbalance.
38. **Regression, Ranking, Retrieval, and Forecasting Metrics**
    - MAE, MSE, RMSE, quantile loss, \(R^2\), MAPE pitfalls, NDCG, MAP, MRR, Recall@K, calibration of forecasts, and selecting metrics that match user impact.
40. **Cross-Validation and Hyperparameter Optimization**
    - K-fold and nested cross-validation, time-aware validation, grid/random/Bayesian search, early stopping and pruning trials, search-space design, budget allocation, and selection bias.
46. **Model Interpretability and Explainability**
    - Global versus local explanations, coefficients, partial dependence, permutation importance, SHAP-style attributions, counterfactuals, surrogate models, explanation stability, and avoiding causal claims.

## Track 4: Deep-learning foundations and architectures

47. **Neural Networks and Backpropagation from Scratch**
    - Perceptrons, multilayer networks, forward passes, chain-rule gradients, mini-batches, vectorization, and implementing a small autodiff training loop.
48. **Activations, Initialization, and Gradient Flow**
    - Sigmoid, tanh, ReLU-family and gated activations; Xavier and He initialization; saturation; dead units; vanishing and exploding gradients; and signal propagation through depth.
49. **Loss Functions and Objective Design**
    - Cross-entropy, binary and multiclass losses, regression and robust losses, margin and metric-learning losses, focal loss, label smoothing, multi-task objectives, and matching loss to metric.
50. **Optimizers and Learning-Rate Schedules**
    - SGD, momentum, adaptive optimizers, weight decay versus L2 penalties, warmup, step/cosine schedules, restarts, batch-size interactions, gradient clipping, and diagnosing unstable updates.
51. **Normalization, Residual Connections, and Modern Blocks**
    - Batch, layer, group, and root-mean-square normalization; residual and skip paths; pre-norm versus post-norm; gated blocks; and why these choices stabilize large models.
52. **Regularizing Deep Networks**
    - Weight decay, dropout, stochastic depth, early stopping, augmentation, label smoothing, mixup, ensembling, data scale, and reading train-validation loss curves.
54. **Recurrent Networks and Sequence Modeling**
    - Backpropagation through time, recurrent networks, LSTM and GRU gates, bidirectionality, sequence-to-sequence learning, teacher forcing, exposure bias, and long-range limitations.
55. **Attention and Transformers**
    - Queries, keys, values, scaled dot-product and multi-head attention, positional representations, masks, encoder/decoder variants, feed-forward blocks, residual paths, and computational complexity.
56. **Embeddings and Representation Learning**
    - Sparse versus dense features, static and contextual embeddings, metric spaces, negative sampling, similarity measures, dimensionality, normalization, collapse, visualization, and evaluation.

## Track 5: Training strategies and systems

62. **Transfer Learning and Fine-Tuning**
    - Feature extraction, frozen versus trainable layers, gradual unfreezing, discriminative learning rates, domain shift, catastrophic forgetting, small-data regimes, and when training from scratch wins.
63. **Self-Supervised Pretraining**
    - Masked prediction, autoregressive prediction, denoising, predictive and joint-embedding objectives, pretext-task design, transfer evaluation, and avoiding representation collapse.
64. **Contrastive Learning — Already Covered**
    - Link to the existing post; an extension may cover hard negatives, false negatives, memory banks, multimodal contrast, and retrieval evaluation without repeating the fundamentals.
65. **Curriculum Learning, Sampling, and Hard-Example Mining**
    - Easy-to-hard schedules, importance and loss-aware sampling, hard positives and negatives, replay, class-balanced batches, data mixtures, and how sampling changes the learned objective.
66. **Knowledge Distillation**
    - Teacher-student training, soft targets and temperature, feature and relation distillation, self-distillation, sequence-level distillation, capacity gaps, and measuring compression-quality trade-offs.
67. **Pruning, Sparsity, and Quantization**
    - Structured versus unstructured pruning, magnitude and movement pruning, quantization-aware versus post-training quantization, integer and low-bit formats, calibration data, kernels, and accuracy loss.
68. **Mixed Precision, Gradient Accumulation, and Activation Checkpointing**
    - FP32, FP16, BF16 and lower precision; loss scaling; effective batch size; recomputation; optimizer-state memory; throughput; numerical stability; and out-of-memory debugging.
69. **Distributed Training**
    - Synchronous versus asynchronous updates, data/model/tensor/pipeline/context/expert parallelism, all-reduce, parameter servers, sharded optimizer states, communication bottlenecks, stragglers, and fault-tolerant checkpoints.
70. **Profiling and Accelerating Training**
    - CPU/GPU timelines, compute versus memory bounds, input-pipeline stalls, batching, prefetch and pinned memory, kernel fusion, compilation, efficient attention, utilization, scaling efficiency, and cost per useful experiment.

## Track 6: Applied modeling domains

76. **Search, Semantic Retrieval, and Approximate Nearest Neighbors**
    - Inverted indexes and BM25, dense and sparse retrieval, dual and cross encoders, vector indexes, similarity metrics, approximate search, hybrid retrieval, reranking, and Recall@K/latency trade-offs.

## Track 7: Reinforcement learning and sequential decisions

81. **Multi-Armed Bandits**
    - Exploration versus exploitation, epsilon-greedy, upper-confidence bounds, Thompson sampling, contextual bandits, regret, non-stationarity, delayed rewards, and safe online experimentation.
82. **Markov Decision Processes and Dynamic Programming**
    - States, actions, transitions, rewards, returns, discounting, policies, value functions, Bellman equations, policy evaluation, value iteration, and the Markov assumption.
83. **Monte Carlo and Temporal-Difference Learning**
    - Episode returns, bootstrapping, TD error, n-step returns, eligibility traces, on-policy versus off-policy learning, SARSA, Q-learning, and the bias-variance trade-off.
84. **Deep Q-Learning**
    - Function approximation, replay buffers, target networks, exploration schedules, Double and Dueling DQN, prioritized replay, instability, overestimation, and sample efficiency.
85. **Policy Gradients**
    - Stochastic policies, the likelihood-ratio objective, REINFORCE, reward-to-go, baselines, entropy bonuses, credit assignment, high-variance gradients, and continuous actions.
86. **Actor-Critic Methods and Proximal Policy Optimization**
    - Value critics, advantage estimation, generalized advantage estimation, clipped objectives, rollout collection, update epochs, entropy and KL controls, and stable implementation details.
87. **Offline Reinforcement Learning and Imitation Learning**
    - Behavior cloning, dataset coverage, distribution shift, conservative value learning, inverse RL, demonstrations, off-policy evaluation, and why deployment-time exploration may be unacceptable.
88. **Model-Based, Multi-Agent, and Hierarchical RL**
    - Learned dynamics, planning and world models, options and temporal abstraction, cooperative and competitive agents, centralized training, non-stationarity, and sim-to-real gaps.
89. **Reward Design, Safe Exploration, and RL Evaluation**
    - Sparse and shaped rewards, specification gaming, constraints, reward hacking, simulators, seeds and confidence intervals, offline policy evaluation, safety limits, and production rollouts.
90. **Group Relative Policy Optimization — Already Covered**
    - Link to the existing post; use it as the final step in a sequence from policy gradients through actor-critic and preference-based language-model training.

## Track 8: Language models, RAG, and post-training

92. **Transformer Language Models in Detail**
    - Decoder-only computation, causal masks, positional and rotary representations, normalization, gated feed-forward layers, grouped/multi-query attention, key-value caches, context length, and parameter counting.
99. **Supervised Fine-Tuning**
    - Instruction and chat data, templates, assistant-only loss, packing, data mixtures, full-parameter tuning, validation, catastrophic forgetting, checkpoint selection, and when SFT changes knowledge versus behavior.
100. **LoRA, QLoRA, and Parameter-Efficient Fine-Tuning**
    - Low-rank updates, rank and target modules, scaling and dropout, adapters and prompt tuning, quantized base models, memory accounting, merging, multiple adapters, serving, and quality trade-offs.
102. **Reinforcement Learning from Human Feedback**
    - The SFT-policy-reward-model pipeline, rollout generation, PPO updates, KL control, advantage estimation, infrastructure cost, instability, safety checks, and online versus offline preference collection.
103. **Direct Preference Optimization and Related Objectives**
    - Reference policies, chosen/rejected pairs, DPO intuition and loss, implicit rewards, beta, preference overfitting, KTO/ORPO/RLOO-style alternatives, and when preference optimization is simpler than RLHF.
104. **Reasoning-Model Post-Training**
    - Verifiable rewards, outcome versus process supervision, rejection sampling, self-training, curriculum, long reasoning traces, GRPO-style updates, reward hacking, and evaluation beyond answer accuracy.
105. **Generation and Decoding Strategies**
    - Greedy decoding, temperature, top-k and nucleus sampling, beam search, repetition controls, constrained decoding, stopping, log probabilities, best-of-N, speculative decoding, and quality-diversity-latency trade-offs.
106. **Efficient LLM Serving**
    - Prefill versus decode, continuous batching, paged key-value caches, prefix caching, chunked prefill, quantization, tensor/pipeline parallelism, speculative decoding, streaming, admission control, and tokens-per-dollar.
107. **LLM Evaluation**
    - Task and capability benchmarks, contamination, deterministic graders, semantic metrics, pairwise preference, human evaluation, model judges and their biases, safety evals, regression suites, and confidence intervals.
108. **Agents, Planning, and Memory**
    - Tool selection, planning loops, state machines, short- and long-term memory, retrieval, reflection, multi-agent patterns, permissions, idempotent actions, traces, evaluation, budgets, and graceful failure.
109. **LLM and Agent Security**
    - Direct and indirect prompt injection, insecure output handling, sensitive-data leakage, poisoning, supply-chain risk, denial of wallet/service, excessive agency, least privilege, sandboxing, and human approval.

## Research basis and coverage check

The roadmap was checked against current role and production-lifecycle guides, framework documentation, and specialized curricula rather than a collection of interview-question listicles:

- [Machine Learning Crash Course](https://developers.google.com/machine-learning/crash-course) for regression, classification, numerical and categorical data, generalization, neural networks, embeddings, language models, production systems, AutoML, and fairness.
- [Rules of Machine Learning](https://developers.google.com/machine-learning/guides/rules-of-ml/) and [Production ML Systems](https://developers.google.com/machine-learning/crash-course/production-ml-systems) for baselines, data dependencies, training-serving skew, feedback loops, testing, serving, and monitoring.
- [Deep Learning Tuning Playbook](https://developers.google.com/machine-learning/guides/deep-learning-tuning-playbook) for scientific tuning, optimizer and learning-rate choices, batch size, instability, and training diagnosis.
- [Professional Machine Learning Engineer exam guide](https://cloud.google.com/learn/certification/guides/machine-learning-engineer) and [Machine Learning Engineer Associate exam guide](https://docs.aws.amazon.com/aws-certification/latest/machine-learning-engineer-associate-01/machine-learning-engineer-associate-01.html) for the current job-level split across data, modeling, deployment, orchestration, monitoring, security, and responsible AI.
- [Scikit-learn User Guide](https://scikit-learn.org/stable/user_guide.html) for supervised and unsupervised algorithms, model selection, preprocessing, calibration, inspection, semi-supervised learning, and common pitfalls.
- [PyTorch Tutorials](https://docs.pytorch.org/tutorials/) for model implementation, performance profiling, automatic mixed precision, compilation, distributed training, quantization, and checkpointing.
- [Recommendation Systems course](https://developers.google.com/machine-learning/recommendation) for candidate generation, collaborative filtering, scoring, and re-ranking.
- [Transformers course](https://huggingface.co/learn/llm-course/en/chapter1/1), [PEFT documentation](https://huggingface.co/docs/peft/), and [TRL documentation](https://huggingface.co/docs/trl/) for tokenization, transformers, datasets, distributed fine-tuning, LoRA/QLoRA, SFT, reward modeling, DPO, PPO, and GRPO.
- [Deep Reinforcement Learning course](https://huggingface.co/learn/deep-rl-course/en/unit0/introduction) for Q-learning, deep Q-networks, policy gradients, actor-critic methods, PPO, multi-agent RL, and imitation learning.
- [vLLM documentation](https://docs.vllm.ai/) for paged key-value caches, continuous batching, quantization, speculative decoding, prefix caching, parallel serving, and streaming.
- [RAG overview](https://learn.microsoft.com/en-us/azure/search/retrieval-augmented-generation-overview) for document ingestion, chunking, vectorization, hybrid retrieval, multimodal content, and agentic retrieval.
- [OWASP Top 10 for LLM Applications](https://genai.owasp.org/llm-top-10/) for prompt injection, sensitive-information disclosure, supply-chain risk, poisoning, improper output handling, excessive agency, and resource abuse.
- [Introduction to Responsible AI](https://developers.google.com/machine-learning/guides/intro-responsible-ai) for fairness, accountability, safety, privacy, transparency, and human impact.

## Completion rule

Treat this as a coverage map, not a promise to chase every new acronym. A new ML topic belongs here only if it adds a durable concept, architecture, evaluation method, training strategy, or production mechanism not already covered above. Framework-specific tutorials should teach the underlying idea and use the framework only as the implementation vehicle.
