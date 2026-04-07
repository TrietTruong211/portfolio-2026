import { sanity } from './client'
import type { Miscellaneous, About, Work, Experience, Skill } from '../../../types/index'

export const getMiscellaneous = (): Promise<Miscellaneous | null> =>
  sanity.fetch<Miscellaneous | null>(
    `*[_type == "miscellaneous"][0] {
      name,
      greeting,
      title,
      "resume": resume.asset->url,
      "profileImage": profileImage.asset->url
    }`
  )

export const getAbouts = (): Promise<About[]> =>
  sanity.fetch<About[]>(
    `*[_type == "abouts"] {
      title,
      description,
      "imgUrl": imgUrl.asset->url
    }`
  )

export const getWorks = (): Promise<Work[]> =>
  sanity.fetch<Work[]>(
    `*[_type == "works"] | order(_createdAt desc) {
      title,
      description,
      projectLink,
      codeLink,
      tags,
      "imgUrl": imgUrl.asset->url
    }`
  )

export const getExperiences = (): Promise<Experience[]> =>
  sanity.fetch<Experience[]>(
    `*[_type == "experiences"] | order(year desc) {
      year,
      "works": works[]-> {
        name,
        company,
        desc
      }
    }`
  )

export const getSkills = (): Promise<Skill[]> =>
  sanity.fetch<Skill[]>(
    `*[_type == "skills"] | order(name asc) {
      name,
      bgColor,
      "icon": icon.asset->url
    }`
  )
