import { BlogPostData } from "./types";
import { llmAndAgentSecurity } from "./llm-and-agent-security";
import { agentsPlanningAndMemory } from "./agents-planning-and-memory";
import { llmEvaluation } from "./llm-evaluation";
import { efficientLlmServing } from "./efficient-llm-serving";
import { generationDecodingStrategies } from "./generation-decoding-strategies";
import { reasoningModelPostTraining } from "./reasoning-model-post-training";
import { directPreferenceOptimization } from "./direct-preference-optimization";
import { reinforcementLearningFromHumanFeedback } from "./reinforcement-learning-from-human-feedback";
import { loraQloraParameterEfficientFineTuning } from "./lora-qlora-parameter-efficient-fine-tuning";
import { supervisedFineTuning } from "./supervised-fine-tuning";
import { transformerLanguageModelsInDetail } from "./transformer-language-models-in-detail";
import { rewardDesignSafeExplorationRlEvaluation } from "./reward-design-safe-exploration-rl-evaluation";
import { modelBasedMultiAgentHierarchicalRl } from "./model-based-multi-agent-hierarchical-rl";
import { offlineRlImitationLearning } from "./offline-rl-imitation-learning";
import { actorCriticProximalPolicyOptimization } from "./actor-critic-proximal-policy-optimization";
import { policyGradients } from "./policy-gradients";
import { deepQLearning } from "./deep-q-learning";
import { monteCarloTemporalDifferenceLearning } from "./monte-carlo-temporal-difference-learning";
import { markovDecisionProcessesDynamicProgramming } from "./markov-decision-processes-dynamic-programming";
import { multiArmedBandits } from "./multi-armed-bandits";
import { searchSemanticRetrievalAnn } from "./search-semantic-retrieval-ann";
import { profilingAcceleratingTraining } from "./profiling-accelerating-training";
import { distributedTraining } from "./distributed-training";
import { mixedPrecisionGradientAccumulationActivationCheckpointing } from "./mixed-precision-gradient-accumulation-activation-checkpointing";
import { pruningSparsityQuantization } from "./pruning-sparsity-quantization";
import { knowledgeDistillation } from "./knowledge-distillation";
import { curriculumLearningSamplingHardExampleMining } from "./curriculum-learning-sampling-hard-example-mining";
import { selfSupervisedPretraining } from "./self-supervised-pretraining";
import { transferLearningFineTuning } from "./transfer-learning-fine-tuning";
import { exampleShowcase } from "./example-showcase";
import { internExp } from "./intern-exp";
import { contrastiveLearning } from "./contrastive-learning";
import { grpoPost } from "./grpo";
import { loadBalancing } from "./load-balancing";
import { cachingPost } from "./caching";
import { systemDesignBasics } from "./system-design-basics";
import { dataPartitioning } from "./data-partitioning";
import { proxies } from "./proxies";
import { redundancyAndReplication } from "./redundancy-and-replication";
import { cdn } from "./cdn";
import { capTheorem } from "./cap-theorem";
import { webProtocols } from "./web-protocols";
import { heartbeatAndChecksum } from "./heartbeat-and-checksum";
import { quorum } from "./quorum";
import { bloomFilters } from "./bloom-filters";
import { consistentHashing } from "./consistent-hashing";
import { cors } from "./cors";
import { rateLimiting } from "./rate-limiting";
import { messageQueues } from "./message-queues";
import { designingUrlShortener } from "./designing-url-shortener";
import { designingPastebin } from "./designing-pastebin";
import { designingInstagram } from "./designing-instagram";
import { designingDropbox } from "./designing-dropbox";
import { designingMessenger } from "./designing-messenger";
import { designingYoutube } from "./designing-youtube";
import { designingTypeahead } from "./designing-typeahead";
import { designingYelp } from "./designing-yelp";
import { designingUber } from "./designing-uber";
import { designingTicketmaster } from "./designing-ticketmaster";
import { designingGoogleDocs } from "./designing-google-docs";
import { designingWebCrawler } from "./designing-web-crawler";
import { designingPaymentSystem } from "./designing-payment-system";
import { designingAdClickAggregator } from "./designing-ad-click-aggregator";
import { designingMetricsMonitoring } from "./designing-metrics-monitoring";
import { designingJobScheduler } from "./designing-job-scheduler";
import { designingChatgpt } from "./designing-chatgpt";
import { designingNotificationSystem } from "./designing-notification-system";
import { changeDataCaptureOutbox } from "./change-data-capture-outbox";
import { probabilityForMachineLearning } from "./probability-for-machine-learning";
import { statisticsEstimationUncertainty } from "./statistics-estimation-uncertainty";
import { informationTheoryForMl } from "./information-theory-for-ml";
import { optimizationFundamentals } from "./optimization-fundamentals";
import { generalizationBiasVariance } from "./generalization-bias-variance";
import { linearRegressionFirstPrinciples } from "./linear-regression-first-principles";
import { naiveBayesProbabilisticClassifiers } from "./naive-bayes-probabilistic-classifiers";
import { decisionTrees } from "./decision-trees";
import { learningToRank } from "./learning-to-rank";
import { regularizedLinearModels } from "./regularized-linear-models";
import { baggingRandomForests } from "./bagging-random-forests";
import { logisticRegressionGlm } from "./logistic-regression-glm";
import { gradientBoostedDecisionTrees } from "./gradient-boosted-decision-trees";
import { nearestNeighborsInstanceBasedLearning } from "./nearest-neighbors-instance-based-learning";
import { clustering } from "./clustering";
import { svmKernelMethods } from "./svm-kernel-methods";
import { dimensionalityReductionManifoldLearning } from "./dimensionality-reduction-manifold-learning";
import { regressionRankingRetrievalForecastingMetrics } from "./regression-ranking-retrieval-forecasting-metrics";
import { crossValidationHyperparameterOptimization } from "./cross-validation-hyperparameter-optimization";
import { classificationMetricsDecisionThresholds } from "./classification-metrics-decision-thresholds";
import { modelInterpretabilityExplainability } from "./model-interpretability-explainability";
import { optimizersLearningRateSchedules } from "./optimizers-learning-rate-schedules";
import { regularizingDeepNetworks } from "./regularizing-deep-networks";
import { recurrentNetworksSequenceModeling } from "./recurrent-networks-sequence-modeling";
import { neuralNetworksBackpropagationFromScratch } from "./neural-networks-backpropagation-from-scratch";
import { lossFunctionsObjectiveDesign } from "./loss-functions-objective-design";
import { normalizationResidualConnectionsModernBlocks } from "./normalization-residual-connections-modern-blocks";
import { attentionAndTransformers } from "./attention-and-transformers";
import { activationsInitializationGradientFlow } from "./activations-initialization-gradient-flow";
import { embeddingsRepresentationLearning } from "./embeddings-representation-learning";

export const blogPosts: Record<string, BlogPostData> = {
  "llm-and-agent-security": llmAndAgentSecurity,
  "agents-planning-and-memory": agentsPlanningAndMemory,
  "llm-evaluation": llmEvaluation,
  "efficient-llm-serving": efficientLlmServing,
  "generation-decoding-strategies": generationDecodingStrategies,
  "reasoning-model-post-training": reasoningModelPostTraining,
  "direct-preference-optimization": directPreferenceOptimization,
  "reinforcement-learning-from-human-feedback": reinforcementLearningFromHumanFeedback,
  "lora-qlora-parameter-efficient-fine-tuning": loraQloraParameterEfficientFineTuning,
  "supervised-fine-tuning": supervisedFineTuning,
  "transformer-language-models-in-detail": transformerLanguageModelsInDetail,
  "reward-design-safe-exploration-rl-evaluation": rewardDesignSafeExplorationRlEvaluation,
  "model-based-multi-agent-hierarchical-rl": modelBasedMultiAgentHierarchicalRl,
  "offline-rl-imitation-learning": offlineRlImitationLearning,
  "actor-critic-proximal-policy-optimization": actorCriticProximalPolicyOptimization,
  "policy-gradients": policyGradients,
  "deep-q-learning": deepQLearning,
  "monte-carlo-temporal-difference-learning": monteCarloTemporalDifferenceLearning,
  "markov-decision-processes-dynamic-programming": markovDecisionProcessesDynamicProgramming,
  "multi-armed-bandits": multiArmedBandits,
  "search-semantic-retrieval-ann": searchSemanticRetrievalAnn,
  "profiling-accelerating-training": profilingAcceleratingTraining,
  "distributed-training": distributedTraining,
  "mixed-precision-gradient-accumulation-activation-checkpointing": mixedPrecisionGradientAccumulationActivationCheckpointing,
  "pruning-sparsity-quantization": pruningSparsityQuantization,
  "knowledge-distillation": knowledgeDistillation,
  "curriculum-learning-sampling-hard-example-mining": curriculumLearningSamplingHardExampleMining,
  "self-supervised-pretraining": selfSupervisedPretraining,
  "transfer-learning-fine-tuning": transferLearningFineTuning,
  "embeddings-representation-learning": embeddingsRepresentationLearning,
  "activations-initialization-gradient-flow": activationsInitializationGradientFlow,
  "attention-and-transformers": attentionAndTransformers,
  "normalization-residual-connections-modern-blocks": normalizationResidualConnectionsModernBlocks,
  "loss-functions-objective-design": lossFunctionsObjectiveDesign,
  "neural-networks-backpropagation-from-scratch": neuralNetworksBackpropagationFromScratch,
  "recurrent-networks-sequence-modeling": recurrentNetworksSequenceModeling,
  "regularizing-deep-networks": regularizingDeepNetworks,
  "optimizers-learning-rate-schedules": optimizersLearningRateSchedules,
  "model-interpretability-explainability": modelInterpretabilityExplainability,
  "classification-metrics-decision-thresholds": classificationMetricsDecisionThresholds,
  "cross-validation-hyperparameter-optimization": crossValidationHyperparameterOptimization,
  "regression-ranking-retrieval-forecasting-metrics": regressionRankingRetrievalForecastingMetrics,
  "dimensionality-reduction-manifold-learning": dimensionalityReductionManifoldLearning,
  "svm-kernel-methods": svmKernelMethods,
  "clustering": clustering,
  "nearest-neighbors-instance-based-learning": nearestNeighborsInstanceBasedLearning,
  "gradient-boosted-decision-trees": gradientBoostedDecisionTrees,
  "logistic-regression-glm": logisticRegressionGlm,
  "bagging-random-forests": baggingRandomForests,
  "regularized-linear-models": regularizedLinearModels,
  "learning-to-rank": learningToRank,
  "decision-trees": decisionTrees,
  "naive-bayes-probabilistic-classifiers": naiveBayesProbabilisticClassifiers,
  "linear-regression-first-principles": linearRegressionFirstPrinciples,
  "generalization-bias-variance": generalizationBiasVariance,
  "optimization-fundamentals": optimizationFundamentals,
  "information-theory-for-ml": informationTheoryForMl,
  "statistics-estimation-uncertainty": statisticsEstimationUncertainty,
  "probability-for-machine-learning": probabilityForMachineLearning,
  "example-showcase": exampleShowcase,
  "intern-exp": internExp,
  "contrastive-learning": contrastiveLearning,
  "grpo": grpoPost,
  "load-balancing": loadBalancing,
  "caching": cachingPost,
  "system-design-basics": systemDesignBasics,
  "data-partitioning": dataPartitioning,
  "proxies": proxies,
  "redundancy-and-replication": redundancyAndReplication,
  "cdn": cdn,
  "cap-theorem": capTheorem,
  "web-protocols": webProtocols,
  "heartbeat-and-checksum": heartbeatAndChecksum,
  "quorum": quorum,
  "bloom-filters": bloomFilters,
  "consistent-hashing": consistentHashing,
  "cors": cors,
  "rate-limiting": rateLimiting,
  "message-queues": messageQueues,
  "designing-url-shortener": designingUrlShortener,
  "designing-pastebin": designingPastebin,
  "designing-instagram": designingInstagram,
  "designing-dropbox": designingDropbox,
  "designing-messenger": designingMessenger,
  "designing-youtube": designingYoutube,
  "designing-typeahead": designingTypeahead,
  "designing-yelp": designingYelp,
  "designing-uber": designingUber,
  "designing-ticketmaster": designingTicketmaster,
  "designing-google-docs": designingGoogleDocs,
  "designing-web-crawler": designingWebCrawler,
  "designing-payment-system": designingPaymentSystem,
  "designing-ad-click-aggregator": designingAdClickAggregator,
  "designing-metrics-monitoring": designingMetricsMonitoring,
  "designing-job-scheduler": designingJobScheduler,
  "designing-chatgpt": designingChatgpt,
  "designing-notification-system": designingNotificationSystem,
  "change-data-capture-outbox": changeDataCaptureOutbox,
};

export type { BlogPostData, BlogPostMeta } from "./types";
