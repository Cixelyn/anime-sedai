import { useMemo, useRef, useState } from "react"
import animeData from "../anime-data"
import animeDataEnglish from "../anime-data-english"
import { domToBlob } from "modern-screenshot"
import { toast } from "sonner"
import { usePersistState } from "./hooks"

export const App = () => {
  const [selectedAnimeIndices, setSelectedAnimeIndices] = usePersistState<string[]>(
    "selectedAnimeIndices",
    []
  )
  const [language, setLanguage] = usePersistState<"zh" | "en">(
    "language",
    "en"
  )

  const currentAnimeData = language === "en" ? animeDataEnglish : animeData

  // Convert indices to titles for the current language
  const selectedAnime = useMemo(() => {
    return selectedAnimeIndices.map(index => {
      const [year, position] = index.split('-')
      const yearData = currentAnimeData[year]
      if (!yearData) return null
      const anime = yearData[parseInt(position)]
      return anime?.title || null
    }).filter(Boolean) as string[]
  }, [selectedAnimeIndices, currentAnimeData])

  const wrapper = useRef<HTMLDivElement>(null)

  const imageToBlob = async () => {
    if (!wrapper.current) return

    const blob = await domToBlob(wrapper.current, {
      scale: 2,
      filter(el) {
        if (el instanceof HTMLElement && el.classList.contains("remove")) {
          return false
        }
        return true
      },
    })

    return blob
  }

  const copyImage = async () => {
    const blob = await imageToBlob()

    if (!blob) return

    await navigator.clipboard.write([
      new ClipboardItem({
        [blob.type]: blob,
      }),
    ])
  }

  const downloadImage = async () => {
    if (!wrapper.current) return

    const blob = await imageToBlob()

    if (!blob) return

    const url = URL.createObjectURL(blob)

    const a = document.createElement("a")
    a.href = url
    a.download = "anime-sedai.png"
    a.click()

    URL.revokeObjectURL(url)
  }

  const [promptType, setPromptType] = useState<"normal" | "zako">("zako")
  const prompt = useMemo(() => {
    const preset =
      promptType === "normal"
        ? `以下是用户的动画观看记录，请生成一个锐评。`
        : `你是一个精通二次元文化的傲娇雌小鬼，需要根据用户提供的动画观看记录，用雌小鬼惯用的嘲讽语气混合动画圈梗生成锐评报告。要求：
1. 结构模板
  - 列出5-6个嘲讽段落
  - 每个段落的所有内容请务必都包含在 ">> 标签" 开始的一行之后！！
  - 每一个嘲讽段落的主题都应当不同，且应当尖锐
  - 你应当大量地使用“杂鱼”、“❤”、“杂鱼~”、“杂鱼❤~”，“不会吧不会吧”等雌小鬼常用词汇
  - 不要在输出的报告中写题目以及任何 markdown 样式，这非常，非常重要！！
2. 内容规则
  - 一些常见的梗类型：
    - 冷门番暴露癖（例："看这种没人听的冷门番，大哥哥该不会在等弹幕里出现'同类'吧？杂鱼❤"）
    - 补番速度羞辱（例："三年才看十部？杂鱼哥哥的补番速度比柯南破案还慢呢~"）
    - 类型单一化（例："全是异世界？大哥哥的想象力比史莱姆还黏稠呢~"）
    - 标题长度玩梗（例："《打了300年史莱姆》这种标题...杂鱼哥哥该不会真信能活300年吧？"）
    - 所有内容必须包含在 ">> 标签" 行之后
  - 想一下还有哪些适合用来嘲讽的梗，但不要太多，否则会显得很杂乱
3. 示例:
"""
>> 补番龟速の杂鱼❤  

不会吧不会吧？从2006到2024年只啃了三部动画？杂鱼哥哥的补番速度比吉良吉影的日常还慢呢❤~等你看完新番，人类都移民火星了杂鱼~杂鱼❤~  

>> 冷门番の孤独癖❤  

太空丹迪和异世界舅舅？看这种没人讨论的冷门番，杂鱼哥哥该不会在弹幕里蹲“同类”吧❤~不会真以为自己是宇宙第一鉴赏家吧？杂鱼❤~   

>> 番量贫瘠の杂鱼❤  

三部动画就敢自称阿宅？杂鱼哥哥的番单比史莱姆还稀薄呢❤~不会吧不会吧，该不会把补番当成就系统刷吧？杂鱼❤~杂鱼~

>> ...

...

>> ...

...
"""

现在开始分析用户的动画观看记录，按上述格式输出锐评报告。
`

    return `
${preset}
用户动画观看记录：(下面的年份是动画发布的年份)
${Object.keys(currentAnimeData)
  .map((year) => {
    const items = currentAnimeData[year] || []

    if (items.length === 0) return ""

    const sliceItems = items.slice(0, 12)
    const watched = sliceItems
      .filter((item) => selectedAnime.includes(item.title))
      .map((item) => item.title)
      .join(", ")
    const unWatched = sliceItems
      .filter((item) => !selectedAnime.includes(item.title))
      .map((item) => item.title)
      .join(", ")

    return [
      `**${year}年**:`,
      `看过: ${watched || "无"}`,
      `没看过: ${unWatched || "无"}`,
    ]
      .filter(Boolean)
      .join("\n")
  })
  .filter(Boolean)
  .join("\n")}
    `.trim()
  }, [selectedAnime, promptType, language, currentAnimeData])

  return (
    <>
      <div className="flex flex-col gap-4 pb-10">
        <div className="p-4 flex flex-col md:items-center ">
          <div
            className="flex flex-col border border-b-0 bg-white w-fit"
            ref={wrapper}
          >
            <div className="border-b justify-between p-2 text-lg  font-bold flex">
              <h1>
                {language === "en" ? "Anime Generations" : "动画世代"}
                <span className="remove"> - {language === "en" ? "Click to select anime you've watched" : "点击选择你看过的动画"}</span>
                <span className="ml-2 text-zinc-400 font-medium">
                  anime-sedai.egoist.dev
                </span>
              </h1>
              <div className="flex items-center gap-4">
                <button
                  className="remove text-sm font-normal border rounded px-2 py-1 hover:bg-zinc-50"
                  onClick={() => setLanguage(language === "en" ? "zh" : "en")}
                >
                  {language === "en" ? "中文" : "English"}
                </button>
                <span className="shrink-0 whitespace-nowrap">
                  {language === "en" ? "I've watched" : "我看过"} {selectedAnime.length}/
                  {
                    Object.values(currentAnimeData).flatMap((year) => {
                      return year.map((item) => item.title).slice(0, 12)
                    }).length
                  }{" "}
                  {language === "en" ? "anime" : "部动画"}
                </span>
              </div>
            </div>
            {Object.keys(currentAnimeData).map((year) => {
              const items = currentAnimeData[year] || []
              return (
                <div key={year} className="flex border-b">
                  <div className="bg-red-500 shrink-0 text-white flex items-center font-bold justify-center p-1 size-16 md:size-20 border-black">
                    {year}
                  </div>
                  <div className="flex shrink-0">
                    {items.slice(0, 12).map((item, itemIndex) => {
                      const animeIndex = `${year}-${itemIndex}`
                      const isSelected = selectedAnimeIndices.includes(animeIndex)
                      return (
                        <button
                          key={animeIndex}
                          className={`size-16 md:size-20 border-l break-all text-center shrink-0 inline-flex items-center p-1 overflow-hidden justify-center cursor-pointer text-sm  ${
                            isSelected ? "bg-green-500" : "hover:bg-zinc-100"
                          }`}
                          title={item.title}
                          onClick={() => {
                            setSelectedAnimeIndices((prev) => {
                              if (isSelected) {
                                return prev.filter(
                                  (index) => index !== animeIndex
                                )
                              }
                              return [...prev, animeIndex]
                            })
                          }}
                        >
                          <span className="leading-tight w-full line-clamp-3">
                            {item.title}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="flex gap-2 justify-center">
          <button
            type="button"
            className="border rounded-md px-4 py-2 inline-flex"
            onClick={() => {
              setSelectedAnimeIndices(
                Object.entries(currentAnimeData).flatMap(([year, items]) => {
                  return items.slice(0, 12).map((_, index) => `${year}-${index}`)
                })
              )
            }}
          >
            {language === "en" ? "Select All" : "全选"}
          </button>

          {selectedAnime.length > 0 && (
            <button
              type="button"
              className="border rounded-md px-4 py-2 inline-flex"
              onClick={() => {
                setSelectedAnimeIndices([])
              }}
            >
              {language === "en" ? "Clear" : "清除"}
            </button>
          )}

          <button
            type="button"
            className="border rounded-md px-4 py-2 inline-flex"
            onClick={() => {
              toast.promise(copyImage(), {
                success: language === "en" ? "Copied successfully" : "复制成功",
                loading: language === "en" ? "Copying..." : "复制中",
                error(error) {
                  return language === "en"
                    ? `Copy failed: ${
                        error instanceof Error ? error.message : "Unknown error"
                      }`
                    : `复制失败: ${
                        error instanceof Error ? error.message : "未知错误"
                      }`
                },
              })
            }}
          >
            {language === "en" ? "Copy Image" : "复制图片"}
          </button>

          <button
            type="button"
            className="border rounded-md px-4 py-2 inline-flex"
            onClick={() => {
              toast.promise(downloadImage(), {
                success: language === "en" ? "Downloaded successfully" : "下载成功",
                loading: language === "en" ? "Downloading..." : "下载中",
                error(error) {
                  return language === "en"
                    ? `Download failed: ${
                        error instanceof Error ? error.message : "Unknown error"
                      }`
                    : `下载失败: ${
                        error instanceof Error ? error.message : "未知错误"
                      }`
                },
              })
            }}
          >
            {language === "en" ? "Download Image" : "下载图片"}
          </button>
        </div>

        <div className="flex flex-col gap-2 max-w-screen-md w-full mx-auto">
          <div className="border focus-within:ring-2 ring-pink-500 focus-within:border-pink-500 rounded-md">
            <div className="flex items-center justify-between p-2 border-b">
              <div className="flex items-center gap-2">
                <span>{language === "en" ? "AI Prompt" : "锐评提示词"}</span>
                <select
                  className="border rounded-md"
                  value={promptType}
                  onChange={(e) => {
                    setPromptType(e.currentTarget.value as any)
                  }}
                >
                  <option value="normal">{language === "en" ? "Normal" : "普通"}</option>
                  <option value="zako">{language === "en" ? "Zako❤" : "杂鱼❤"}</option>
                </select>
              </div>

              <div className="flex items-center gap-4">
                <button
                  type="button"
                  className="text-sm text-zinc-500 hover:bg-zinc-100 px-1.5 h-7 flex items-center rounded-md"
                  onClick={() => {
                    navigator.clipboard.writeText(prompt)
                    toast.success(language === "en" ? "Copied successfully" : "复制成功")
                  }}
                >
                  {language === "en" ? "Copy" : "复制"}
                </button>

                <button
                  type="button"
                  className="text-sm text-zinc-500 hover:bg-zinc-100 px-1.5 h-7 flex items-center rounded-md"
                  onClick={() => {
                    location.href = `chatwise://chat?input=${encodeURIComponent(
                      prompt
                    )}`
                  }}
                >
                  {language === "en" ? "Open in ChatWise (requires installation)" : "在 ChatWise 中打开 (需要先安装)"}
                </button>
              </div>
            </div>
            <textarea
              readOnly
              className="outline-none w-full p-2 resize-none cursor-default"
              rows={10}
              value={prompt}
            />
          </div>
        </div>

        <div className="mt-2 text-center">
          {language === "en" ? "Most popular anime by year, data from bgm.tv, created by" : "历年关注最多的动画，数据来自 bgm.tv，由"}
          <a
            href="https://x.com/localhost_4173"
            target="_blank"
            className="underline"
          >
            {language === "en" ? "Low Altitude Flight" : "低空飞行"}
          </a>
          {language === "en" ? ", " : "制作，"}
          <a
            href="https://github.com/egoist/anime-sedai"
            target="_blank"
            className="underline"
          >
            {language === "en" ? "View source" : "查看代码"}
          </a>
        </div>

        <div className="text-center">
          {language === "en" ? "Other products by the author: " : "作者的其它产品: "}
          <a
            href="https://chatwise.app"
            target="_blank"
            className="underline inline-flex items-center gap-1"
          >
            <img src="https://chatwise.app/favicon.png" className="size-4" />{" "}
            ChatWise
          </a>
          {language === "en" ? ", an elegant AI chat client" : ", 一个优雅的 AI 聊天客户端"}
        </div>
      </div>
    </>
  )
}
