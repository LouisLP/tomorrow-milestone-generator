export default {
  challenges: {
    list: {
      title: 'Challenges',
      create: 'New challenge',
      loading: 'Loading challenges',
      milestoneCount: 'No milestones | 1 milestone | {count} milestones',
      updated: 'Updated {time}',
      empty: {
        title: 'No challenges yet',
        body: 'Write a title and a Brief, and the AI drafts the milestones for you to review.',
      },
    },
    new: {
      title: 'New challenge',
      placeholder: 'Placeholder: write a title and Brief, generate Draft Milestones, review, save.',
    },
    detail: {
      title: 'Challenge',
      notFound: 'Challenge not found',
      loading: 'Loading challenge',
      titleLabel: 'Challenge title',
      brief: 'Brief',
      briefHint: 'Changing the Brief only affects milestones generated from now on.',
      milestones: 'Milestones',
      milestoneTitleLabel: 'Milestone {n} title',
      milestoneDescriptionLabel: 'Milestone {n} description',
      deleteMilestone: 'Delete milestone {n}',
      deleteMilestoneDialog: {
        title: 'Delete this milestone?',
        description: '“{title}” will be removed from the challenge. This can\'t be undone.',
      },
      deleteChallenge: 'Delete challenge',
      deleteChallengeDialog: {
        title: 'Delete this challenge?',
        description: '“{title}” and its {count} milestones will be deleted. This can\'t be undone. | “{title}” and its milestone will be deleted. This can\'t be undone. | “{title}” and its {count} milestones will be deleted. This can\'t be undone.',
      },
    },
    notFound: {
      title: 'Page not found',
    },
  },
}
