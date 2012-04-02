(ns codegroup.app
  (:require [crate.core :as crate]
            [domina :as dm]
            [domina.css :as dmc]
            [goog.dom :as gdom]
            [clojure.browser.dom :as dom]
            [clojure.string :as string]
            [clojure.browser.event :as event]))

(defn add-msg [msg-el]
  (gdom/append (dm/single-node (dmc/sel "#chatLog")) msg-el))

(def ws-url "ws://localhost:8080/socket")
(def socket (js/WebSocket. ws-url))
(add-msg (crate/html [:p.event "Outgoing: " [:div#out]]))

(set! (.-onmessage socket)
      (fn add-msg [msg]
         (set! (.-innerHTML (dom/get-element :in)) (.-data msg))))

(defn send-it []
  (let [text (.-value (goog.dom/getElement "text"))]
    (.send socket text)
    (set! (.-innerHTML (dom/get-element :out)) text)))

(defn console-loop []
  (send-it)
  (js/setTimeout console-loop 2000))

(defn socket-ready []
  (add-msg 
    (crate/html [:p.event "Socket Status: " + (str (.-readyState socket)) + " (open) " [:div#in]]))
  (console-loop))

(set! (.-onopen socket) socket-ready)

(defn enter-cb [e]
  (if (= (.-keyCode e) 13)
    (send-it)))

(event/listen (dm/single-node (dmc/sel "#text"))
              :keypress
              (fn [e]
                (if (= (.-keyCode e) 13)
                  (send-it))))
