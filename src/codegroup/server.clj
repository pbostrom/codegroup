(ns codegroup.server
  (:use compojure.core, aleph.core, aleph.http, hiccup.core, hiccup.page, lamina.core)
  (:require [compojure.route :as route])
  (:gen-class))

(def broadcast-channel (permanent-channel))

(defn chat-handler [ch handshake]
  (receive ch
           (fn [name]
             (println (str "handler called on channel: " ch))
             (siphon (map* #(str name ": " %) ch) broadcast-channel)
             (siphon broadcast-channel ch))))
;             (siphon ch broadcast-channel))))

(defn layout [& content]
  (html5 [:head [:title "new page"]
;          (include-js "http://ajax.googleapis.com/ajax/libs/jquery/1.7.1/jquery.min.js")
          (include-css "/css/main.css")]
         [:body content]
         (include-js "/js/bootstrap.js")
         [:script {:type "text/javascript"} "goog.require('myrepl')"]))

(def main-view 
  [:div#wrapper [:div#container 
                 [:h1 "WebSockets client"]
                 [:div#chatLog]
                 [:input#text {:type "text"}]
                 [:button#disconnect "Disconnect"]]])


(defroutes my-app 
  (GET "/" [] (layout main-view))
  (GET "/socket" [] (wrap-aleph-handler chat-handler))
  (route/resources "/")
  (route/not-found (layout [:p "aww... this doesn't exist"])))

(defn -main []
  (start-http-server (wrap-ring-handler my-app) {:port 8080 :websocket true})
  (println "server started"))
