import { useMemo, useRef } from "react"
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