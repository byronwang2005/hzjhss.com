import type { DriveOverview, DriveOverviewTopic, TopicDetail, TopicMetadata } from "./topic";
import { isDriveAdmin } from "./session";

export interface TopicMetadataApiResponse extends TopicMetadata {
  /** @deprecated Use analysisKeywords. */
  description: string;
}

export interface TopicDetailApiResponse extends Omit<TopicDetail, "topic"> {
  topic: TopicMetadataApiResponse;
  canEditAnalysisScope: boolean;
  canManageFeaturedOutput: boolean;
  canTransferTopicOwner: boolean;
  canDeleteTopic: boolean;
}

export interface DriveOverviewApiResponse extends Omit<DriveOverview, "topics"> {
  topics: Array<DriveOverviewTopic & { /** @deprecated Use analysisKeywords. */ description: string }>;
}

export function toTopicDetailApiResponse(detail: TopicDetail, viewerDisplayName?: string): TopicDetailApiResponse {
  const canManageTopic = detail.topic.owner === viewerDisplayName || Boolean(viewerDisplayName && isDriveAdmin(viewerDisplayName));
  return {
    ...detail,
    canEditAnalysisScope: canManageTopic,
    canManageFeaturedOutput: canManageTopic,
    canTransferTopicOwner: canManageTopic,
    canDeleteTopic: Boolean(viewerDisplayName && isDriveAdmin(viewerDisplayName)),
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
