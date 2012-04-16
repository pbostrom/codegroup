(ns codegroup.app
  (:use [codegroup.utils :only (make-js-map clj->js)])
  (:require [crate.core :as crate]
            [domina :as dm]
            [domina.css :as dmc]
            [goog.dom :as gdom]
            [clojure.browser.dom :as dom]
            [clojure.string :as string]
            [clojure.browser.event :as event]))


(def jq js/jQuery)
(def ws-url "ws://localhost:8080/socket")
(def socket (js/WebSocket. ws-url))

(defn add-msg [msg-el]
  (gdom/append (dm/single-node (dmc/sel "#chatLog")) msg-el))

(defn send-it []
  (let [text (.-value (goog.dom/getElement "text"))]
    (.send socket text)
    (set! (.-innerHTML (dom/get-element :out)) text)))

(defn console-loop []
  (send-it)
  (js/setTimeout console-loop 2000))

(defn socket-ready []
  (add-msg 
    (crate/html 
      [:p.event "Socket Status: " + 
       (str (.-readyState socket)) + " (open) " [:div#in]]))
  (console-loop))

(defn enter-cb [e]
  (if (= (.-keyCode e) 13)
    (send-it)))

(defn init-repl [config]
  (-> (jq "#console")
    (.console config)))

(defn cljValidate []
  false)

(defn cljHandle [line report]
  make-js-map (array {:msg "\n"
               :className "jquery-console-message"}))

(def clj-repl 
  (make-js-map {:welcomeMessage "Clojure REPL"
                :promptLabel "user=> "
                :commandValidate cljValidate
                :commandHandle cljHandle
                :autofocus true
                :animateScroll true
                :promptHistory true}))


(def jqconsole
  (-> (jq "#console")
    (.jqconsole "hi\n" "=> " " ")))

(defn startPrompt []
  (.Prompt jqconsole true (fn [input]
                            (.Write jqconsole (str input "\n", "jqconsole-output"))
                            (startPrompt))))

;(init-repl clj-repl)
;(startPrompt)

(defn paren-match? [sexp]
  (>=
    (count (filter #(= % ")") sexp))
    (count (filter #(= % "(") sexp))))

(def indent-level (atom 0))
(defn sexp-indent [sexp]
  (let [sexp-line (.trim jq (last (js->clj (.split sexp "\n"))))
        indent-vec (reduce 
                     (fn [v x]
                       (let [idx (first v)
                             stack (second v)]
                         (cond 
                           (= x "(") [(inc idx) (cons idx stack)]
                           (= x ")") [(inc idx) (rest stack)]
                           true [(inc idx) stack]))) 
                     [0 []] (seq sexp-line))
        indent-val (- (+ (first (second indent-vec)) 2) @indent-level)]
    (reset! indent-level indent-val)
    indent-val))

(defn handler [sexp]
  (if sexp 
    (.Write jqconsole (str "==>" sexp "\n")))
  (.Prompt jqconsole true handler (fn [sexp]
                                    (if (paren-match? sexp)
                                      false
                                      (sexp-indent sexp)))))

(handler nil)
(set! (.-onmessage socket)
      (fn add-msg [msg]
         (set! (.-innerHTML (dom/get-element :in)) (.-data msg))))
(add-msg (crate/html [:p.event "Outgoing: " [:div#out]]))

(set! (.-onopen socket) socket-ready)

(event/listen (dm/single-node (dmc/sel "#text"))
              :keypress
              (fn [e]
                (if (= (.-keyCode e) 13)
                  (send-it))))
