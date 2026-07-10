import type { DriveOverview, DriveOverviewTopic, TopicDetail, TopicMetadata } from "./topic";

export interface TopicMetadataApiResponse extends TopicMetadata {
  /** @deprecated Use analysisKeywords. */
  description: string;
}

export interface TopicDetailApiResponse extends Omit<TopicDetail, "topic"> {
  topic: TopicMetadataApiResponse;
}

export interface DriveOverviewApiResponse extends Omit<DriveOverview, "topics"> {
  topics: Array<DriveOverviewTopic & { /** @deprecated Use analysisKeywords. */ description: string }>;
}

export function toTopicDetailApiResponse(detail: TopicDetail): TopicDetailApiResponse {
  return {
    ...detail,
    topic: {
      ...detail.topic,
      description: detail.topic.analysisKeywords,
    },
  };
}

export function toDriveOverviewApiResponse(overview: DriveOverview): DriveOverviewApiResponse {
  return {
    topics: overview.topics.map((topic) => ({
      ...topic,
      description: topic.analysisKeywords,
    })),
  };
}
