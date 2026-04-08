import { sanity } from './client'
import type { Miscellaneous, About, Work, Experience, Skill, Testimonial, Brand, FooterInfo } from '../../types/index'

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
    `*[_type == "experiences"] {
      year,
      works[] { name, company, desc },
      "startYear":  string::split(string::split(year, " - ")[0], "/")[1],
      "startMonth": string::split(string::split(year, " - ")[0], "/")[0]
    } | order(startYear desc, startMonth desc) {
      year,
      works
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

export const getTestimonials = (): Promise<Testimonial[]> =>
  sanity.fetch<Testimonial[]>(
    `*[_type == "testimonials"] {
      feedback,
      name,
      company,
      "imgUrl": imgurl.asset->url
    }`
  )

export const getBrands = (): Promise<Brand[]> =>
  sanity.fetch<Brand[]>(
    `*[_type == "brands"] {
      name,
      url,
      "imgUrl": imgUrl.asset->url
    }`
  )

export const getFooterInfo = (): Promise<FooterInfo | null> =>
  sanity.fetch<FooterInfo | null>(
    `*[_type == "footer"][0] {
      email,
      phoneNumber
    }`
  )
