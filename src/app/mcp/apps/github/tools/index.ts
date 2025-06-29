import { getMeTool } from "./context";
import {
	addIssueCommentTool,
	createIssueTool,
	getIssueCommentsTool,
	getIssueTool,
	listIssuesTool,
	searchIssuesTool,
	updateIssueTool,
} from "./issues";
import {
	createPullRequestTool,
	getPullRequestCommentsTool,
	getPullRequestDiffTool,
	getPullRequestFilesTool,
	getPullRequestReviewsTool,
	getPullRequestStatusTool,
	getPullRequestTool,
	listPullRequestsTool,
	mergePullRequestTool,
	updatePullRequestBranchTool,
	updatePullRequestTool,
} from "./pull-requests";
import {
	createBranchTool,
	createOrUpdateFileTool,
	createRepositoryTool,
	deleteFileTool,
	forkRepositoryTool,
	getCommitTool,
	getFileContentsTool,
	listBranchesTool,
	listCommitsTool,
	pushFilesTool,
} from "./repositories";
import {
	searchCodeTool,
	searchRepositoriesTool,
	searchUsersTool,
} from "./search";

export const githubTools = [
	// User tools
	getMeTool,

	// Repository management tools
	createRepositoryTool,
	forkRepositoryTool,
	getFileContentsTool,
	createOrUpdateFileTool,
	deleteFileTool,
	pushFilesTool,

	// Branch and commit tools
	listBranchesTool,
	createBranchTool,
	getCommitTool,
	listCommitsTool,

	// Pull request tools
	getPullRequestTool,
	createPullRequestTool,
	updatePullRequestTool,
	listPullRequestsTool,
	mergePullRequestTool,
	getPullRequestFilesTool,
	getPullRequestDiffTool,
	getPullRequestStatusTool,
	updatePullRequestBranchTool,
	getPullRequestCommentsTool,
	getPullRequestReviewsTool,

	// Issue management tools
	getIssueTool,
	addIssueCommentTool,
	searchIssuesTool,
	createIssueTool,
	listIssuesTool,
	updateIssueTool,
	getIssueCommentsTool,

	// Search tools
	searchRepositoriesTool,
	searchCodeTool,
	searchUsersTool,
];
