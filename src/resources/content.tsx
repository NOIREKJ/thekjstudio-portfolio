import { About, Blog, Gallery, Home, Newsletter, Person, Social, Work } from "@/types";
import { Line, Row, Text } from "@once-ui-system/core";

const person: Person = {
  firstName: "Joon",
  lastName: "Kim",
  name: `Joon Kim`,
  role: "Composer & App Developer",
  avatar: "/images/kimjoonmain.jpeg",
  email: "kimwns109@gmail.com",
  location: "Asia/Seoul",
  languages: ["Korean", "English"],
};

const newsletter: Newsletter = {
  display: false,
  title: <>Subscribe to {person.firstName}'s Newsletter</>,
  description: <>Occasional notes on music, design, and code</>,
};

const social: Social = [
  {
    name: "GitHub",
    icon: "github",
    link: "https://github.com/NOIREKJ",
    essential: true,
  },
  {
    name: "YouTube",
    icon: "youtube",
    link: "https://www.youtube.com/@K_Joon_P",
    essential: true,
  },
  {
    name: "Spotify",
    icon: "spotify",
    link: "https://open.spotify.com/user/31waehtdbctb5mqpag7pmrmnmhte",
    essential: true,
  },
  {
  name: "Apple Music",
  icon: "appleMusic",
  link: "https://music.apple.com/profile/K_Joon_P",
  essential: true,
},
{
  name: "SoundCloud",
  icon: "soundcloud",
  link: "https://on.soundcloud.com/5UnKPuPovp5dgfz96",
  essential: true,
},
  {
    name: "Email",
    icon: "email",
    link: `mailto:${person.email}`,
    essential: false,
  },
];

const home: Home = {
  path: "/",
  image: "/images/kimjoonmain.jpeg",
  label: "Home",
  title: `${person.name}'s Portfolio`,
  description: `Portfolio website showcasing my work as a ${person.role}`,
  headline: <>Composing music, crafting apps</>,
  featured: {
    display: true,
    title: (
      <Row gap="12" vertical="center">
        <strong className="ml-4">NOIRE</strong>{" "}
        <Line background="brand-alpha-strong" vert height="20" />
        <Text marginRight="4" onBackground="brand-medium">
          Featured project
        </Text>
      </Row>
    ),
    href: "/work/noire",
  },
  subline: (
    <>
      I'm Joon — a composer and app developer based in Seoul.<br />
      I write music and design apps that quietly help people live better.
    </>
  ),
};

const about: About = {
  path: "/about",
  label: "About",
  title: `About – ${person.name}`,
  description: `Meet ${person.name}, ${person.role} from Seoul`,
  tableOfContent: {
    display: true,
    subItems: false,
  },
  avatar: {
    display: true,
  },
  calendar: {
    display: false,
    link: "https://cal.com",
  },
  intro: {
    display: true,
    title: "Introduction",
    description: (
      <>
        Joon is a Seoul-based composer and app developer who moves freely between
        music and software. He writes original scores, designs digital products,
        and builds tools that simplify everyday life — most recently NOIRE,
        a personal assistant app for managing what matters.
      </>
    ),
  },
  work: {
    display: true,
    title: "Work",
    experiences: [
      {
        company: "the KJ Studio",
        timeframe: "2024 — Present",
        role: "Founder · Composer · Developer",
        achievements: [
          <>
            Founded the KJ Studio — an independent practice combining music
            composition with thoughtful app design.
          </>,
          <>
            Released original tracks across Spotify, Apple Music, and SoundCloud
            under the artist name K_Joon_P.
          </>,
        ],
        images: [],
      },
    ],
  },
  studies: {
    display: false,
    title: "Studies",
    institutions: [],
  },
  technical: {
    display: true,
    title: "Skills",
    skills: [
      {
        title: "Music Composition",
        description: (
          <>Original composition, arrangement, and production across genres.</>
        ),
        tags: [],
        images: [],
      },
      {
        title: "App Design & Development",
        description: (
          <>Designing and building apps with a focus on minimal, intuitive interfaces.</>
        ),
        tags: [],
        images: [],
      },
    ],
  },
};

const blog: Blog = {
  path: "/blog",
  label: "Blog",
  title: "Notes",
  description: `Occasional writing by ${person.name}`,
};

const work: Work = {
  path: "/work",
  label: "Work",
  title: `Projects – ${person.name}`,
  description: `Music and app projects by ${person.name}`,
};

const gallery: Gallery = {
  path: "/gallery",
  label: "Gallery",
  title: `Gallery – ${person.name}`,
  description: `A visual collection by ${person.name}`,
  images: [
    {
      src: "/images/gallery/horizontal-1-kj-blueshirt.jpeg",
      alt: "image",
      orientation: "horizontal",
    },
    {
      src: "/images/gallery/vertical-1-kj-piano.jpeg",
      alt: "image",
      orientation: "vertical",
    },
    {
      src: "/images/gallery/horizontal-2-kj-blueshirt.jpeg",
      alt: "image",
      orientation: "horizontal",
    },
    {
      src: "/images/gallery/vertical-2-kj-family.jpeg",
      alt: "image",
      orientation: "vertical",
    },
    {
      src: "/images/gallery/vertical-3-kj-spring.jpeg",
      alt: "image",
      orientation: "vertical",
    },
    {
      src: "/images/gallery/horizontal-3-kj-beach.jpeg",
      alt: "image",
      orientation: "horizontal",
    },
    {
      src: "/images/gallery/horizontal-4-kj-room.jpg",
      alt: "image",
      orientation: "horizontal",
    },
    {
      src: "/images/gallery/vertical-4-kj-piano.jpeg",
      alt: "image",
      orientation: "vertical",
    },
  ],
};

export { person, social, newsletter, home, about, blog, work, gallery };