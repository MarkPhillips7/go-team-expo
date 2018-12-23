export const playerAvailability = {
  active: "active",
  unavailable: "unavailable",
};

export const positionCategories = {
  keeper: {
    name: "Keeper",
    color: "red",
    location: "field",
  },
  defense: {
    name: "Defense",
    color: "purple",
    location: "field",
  },
  midfield: {
    name: "Midfield",
    color: "blue",
    location: "field",
  },
  offense: {
    name: "Offense",
    color: "forestgreen",
    location: "field",
  },
  substitute: {
    name: "Substitute",
    color: "gray",
    location: "bench",
  },
  unavailable: {
    name: "Unavailable",
    color: "black",
    description: "Injured or absent",
    location: "unknown",
  }
};

export const positions = {
  keeper: {
    name: "Keeper",
    positionCategory: positionCategories.keeper,
  },
  leftBack: {
    name: "Left Back",
    positionCategory: positionCategories.defense,
  },
  rightBack: {
    name: "Right Back",
    positionCategory: positionCategories.defense,
  },
  leftMid: {
    name: "Left Mid",
    positionCategory: positionCategories.midfield,
  },
  rightMid: {
    name: "Right Mid",
    positionCategory: positionCategories.midfield,
  },
  leftForward: {
    name: "Left Forward",
    positionCategory: positionCategories.offense,
  },
  rightForward: {
    name: "Right Forward",
    positionCategory: positionCategories.offense,
  },
  substitute: {
    name: "Substitute",
    positionCategory: positionCategories.substitute,
  },
  unavailable: {
    name: "Unavailable",
    positionCategory: positionCategories.unavailable,
  },
};

export const gameRoster = [
  {
    name: "Willow",
    preferredPositionCategories: [
      positionCategories.offense,
    ],
  },{
    name: "Katherine",
    preferredPositionCategories: [
      positionCategories.keeper,
      positionCategories.defense,
    ],
  },{
    name: "Parker",
    preferredPositionCategories: [
      positionCategories.offense,
    ],
  },{
    name: "Lily Z",
    preferredPositionCategories: [
      positionCategories.offense,
    ],
  },{
    name: "Xiana",
    preferredPositionCategories: [
      positionCategories.midfield,
    ],
  },{
    name: "Ellie",
    preferredPositionCategories: [
      positionCategories.midfield,
    ],
  },{
    name: "Abby",
    preferredPositionCategories: [
      positionCategories.offense,
    ],
  },{
    name: "Taylor",
    preferredPositionCategories: [
      positionCategories.offense,
    ],
  },{
    name: "Kaylee",
    preferredPositionCategories: [
      positionCategories.midfield,
    ],
  },{
    name: "Lily B",
    preferredPositionCategories: [
      positionCategories.defense,
    ],
  },{
    name: "Iona",
    preferredPositionCategories: [
      positionCategories.keeper,
    ],
  },
];
