(ns codegroup.jquery)
(def jq js/jQuery)
(-> (jq "#container")
  (.append "<span>hello<span>"))
